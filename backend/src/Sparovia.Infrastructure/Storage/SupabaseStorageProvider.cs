namespace Sparovia.Infrastructure.Storage;

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using Sparovia.Application.Common.Interfaces;

using System.Collections.Concurrent;

public class SupabaseStorageProvider : IStorageProvider
{
    private static readonly ConcurrentDictionary<string, byte[]> _memoryStore = new(StringComparer.OrdinalIgnoreCase);
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupabaseStorageProvider> _logger;
    private readonly string _supabaseUrl;
    private readonly string? _supabaseKey;
    private readonly string _defaultBucket;
    private readonly string? _connectionString;
    private readonly string _storageDir;

    public SupabaseStorageProvider(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseStorageProvider> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        _supabaseUrl = (_configuration["Supabase:Url"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_URL")
            ?? "https://ejvpbjbehujqcnwllxby.supabase.co").TrimEnd('/');

        _supabaseKey = _configuration["Supabase:Key"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
            ?? Environment.GetEnvironmentVariable("SUPABASE_KEY")
            ?? Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");

        _defaultBucket = _configuration["Supabase:Bucket"]
            ?? Environment.GetEnvironmentVariable("SUPABASE_BUCKET")
            ?? "sparovia-images";

        _connectionString = _configuration.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        var envDir = Environment.GetEnvironmentVariable("STORAGE_PATH");
        _storageDir = !string.IsNullOrWhiteSpace(envDir)
            ? envDir
            : Path.Combine(AppContext.BaseDirectory, "storage_data");

        try
        {
            if (!Directory.Exists(_storageDir))
            {
                Directory.CreateDirectory(_storageDir);
            }
        }
        catch { }
    }

    private string ResolveBucket(string bucket)
    {
        if (string.IsNullOrWhiteSpace(bucket) || string.Equals(bucket, "images", StringComparison.OrdinalIgnoreCase))
        {
            return _defaultBucket;
        }
        return bucket;
    }

    private static string NormalizeObjectName(string objectName)
    {
        return objectName.TrimStart('/');
    }

    public async Task<string> UploadAsync(
        string bucket,
        string objectName,
        Stream data,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucket);
        var cleanPath = NormalizeObjectName(objectName);
        var key = $"{targetBucket}/{cleanPath}";

        using var ms = new MemoryStream();
        if (data.CanSeek)
        {
            data.Seek(0, SeekOrigin.Begin);
        }
        await data.CopyToAsync(ms, cancellationToken);
        var bytes = ms.ToArray();
        _memoryStore[key] = bytes;
        _memoryStore[$"{bucket}/{objectName}"] = bytes;

        // 0. Write to local disk cache
        try
        {
            var filePath = Path.Combine(_storageDir, key.Replace('/', Path.DirectorySeparatorChar));
            var parentDir = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir))
            {
                Directory.CreateDirectory(parentDir);
            }
            await File.WriteAllBytesAsync(filePath, bytes, cancellationToken);
        }
        catch { }

        // 1. Upload to Supabase Storage if credentials are configured
        if (!string.IsNullOrWhiteSpace(_supabaseKey))
        {
            try
            {
                var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{targetBucket}/{cleanPath}";
                using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
                request.Headers.Add("apikey", _supabaseKey);
                request.Headers.Add("x-upsert", "true");

                var content = new ByteArrayContent(bytes);
                content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                request.Content = content;

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Successfully uploaded {ObjectName} to Supabase Storage bucket {Bucket}", cleanPath, targetBucket);
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Supabase Storage upload returned {StatusCode}: {Error}", response.StatusCode, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Supabase Storage upload encountered an exception for {ObjectName}", cleanPath);
            }
        }

        // 2. Also persist to PostgreSQL StorageBlobs for resilience across restarts
        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync(cancellationToken);
                var sql = @"
                    INSERT INTO ""StorageBlobs"" (""Key"", ""Bucket"", ""ContentType"", ""Data"", ""CreatedAt"")
                    VALUES (@key, @bucket, @contentType, @data, @now)
                    ON CONFLICT (""Key"") DO UPDATE
                    SET ""Data"" = EXCLUDED.""Data"", ""ContentType"" = EXCLUDED.""ContentType"", ""CreatedAt"" = EXCLUDED.""CreatedAt"";";
                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("key", key);
                cmd.Parameters.AddWithValue("bucket", targetBucket);
                cmd.Parameters.AddWithValue("contentType", contentType);
                cmd.Parameters.AddWithValue("data", bytes);
                cmd.Parameters.AddWithValue("now", DateTime.UtcNow);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "StorageBlobs backup write completed or handled.");
            }
        }

        return $"storage://{key}";
    }

    public async Task<Stream> DownloadAsync(
        string bucket,
        string objectName,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucket);
        var cleanPath = NormalizeObjectName(objectName);
        var key = $"{targetBucket}/{cleanPath}";

        // 0. Check in-memory store
        if (_memoryStore.TryGetValue(key, out var memBytes) && memBytes.Length > 0)
        {
            return new MemoryStream(memBytes);
        }
        if (_memoryStore.TryGetValue($"{bucket}/{objectName}", out var altMemBytes) && altMemBytes.Length > 0)
        {
            return new MemoryStream(altMemBytes);
        }

        // 1. Try downloading from Supabase Storage if configured
        if (!string.IsNullOrWhiteSpace(_supabaseKey))
        {
            try
            {
                var downloadUrl = $"{_supabaseUrl}/storage/v1/object/authenticated/{targetBucket}/{cleanPath}";
                using var request = new HttpRequestMessage(HttpMethod.Get, downloadUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
                request.Headers.Add("apikey", _supabaseKey);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                    var ms = new MemoryStream();
                    await stream.CopyToAsync(ms, cancellationToken);
                    ms.Seek(0, SeekOrigin.Begin);
                    return ms;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Supabase Storage direct download failed for {ObjectName}, trying fallback", cleanPath);
            }
        }

        // 2. Check PostgreSQL StorageBlobs table with key normalization fallback
        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync(cancellationToken);

                var possibleKeys = new[]
                {
                    $"{targetBucket}/{cleanPath}",
                    $"images/{cleanPath}",
                    cleanPath
                };

                foreach (var k in possibleKeys)
                {
                    var sql = @"SELECT ""Data"" FROM ""StorageBlobs"" WHERE ""Key"" = @key LIMIT 1;";
                    await using var cmd = new NpgsqlCommand(sql, conn);
                    cmd.Parameters.AddWithValue("key", k);
                    var result = await cmd.ExecuteScalarAsync(cancellationToken);
                    if (result is byte[] dbBytes && dbBytes.Length > 0)
                    {
                        return new MemoryStream(dbBytes);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "StorageBlobs fallback read failed for {ObjectName}", cleanPath);
            }
        }

        // 3. Check local disk cache
        try
        {
            var localPath = Path.Combine(_storageDir, key.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(localPath))
            {
                var diskBytes = await File.ReadAllBytesAsync(localPath, cancellationToken);
                if (diskBytes.Length > 0)
                {
                    return new MemoryStream(diskBytes);
                }
            }
        }
        catch { }

        return new MemoryStream();
    }

    public async Task<string?> GetSignedUrlAsync(
        string bucket,
        string objectName,
        TimeSpan expiresIn,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_supabaseKey))
        {
            return null;
        }

        var targetBucket = ResolveBucket(bucket);
        var cleanPath = NormalizeObjectName(objectName);

        try
        {
            var signUrl = $"{_supabaseUrl}/storage/v1/object/sign/{targetBucket}/{cleanPath}";
            using var request = new HttpRequestMessage(HttpMethod.Post, signUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
            request.Headers.Add("apikey", _supabaseKey);

            var payload = new { expiresIn = (int)expiresIn.TotalSeconds };
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                var node = JsonNode.Parse(body);
                var signedPath = node?["signedURL"]?.GetValue<string>();
                if (!string.IsNullOrWhiteSpace(signedPath))
                {
                    return $"{_supabaseUrl}/storage/v1{signedPath}";
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Supabase Storage sign URL creation failed for {ObjectName}", cleanPath);
        }

        return null;
    }

    public async Task DeleteAsync(
        string bucket,
        string objectName,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucket);
        var cleanPath = NormalizeObjectName(objectName);
        var key = $"{targetBucket}/{cleanPath}";

        _memoryStore.TryRemove(key, out _);
        _memoryStore.TryRemove($"{bucket}/{objectName}", out _);
        try
        {
            var localPath = Path.Combine(_storageDir, key.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(localPath)) File.Delete(localPath);
        }
        catch { }

        if (!string.IsNullOrWhiteSpace(_supabaseKey))
        {
            try
            {
                var deleteUrl = $"{_supabaseUrl}/storage/v1/object/{targetBucket}/{cleanPath}";
                using var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
                request.Headers.Add("apikey", _supabaseKey);
                await _httpClient.SendAsync(request, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete {ObjectName} from Supabase Storage", cleanPath);
            }
        }

        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync(cancellationToken);
                var sql = @"DELETE FROM ""StorageBlobs"" WHERE ""Key"" = @key OR ""Key"" = @altKey;";
                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("key", key);
                cmd.Parameters.AddWithValue("altKey", $"images/{cleanPath}");
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch { }
        }
    }
}
