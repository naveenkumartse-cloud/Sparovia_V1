namespace Sparovia.Infrastructure.Storage;

using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sparovia.Application.Common.Interfaces;

public class SupabaseStorageProvider : IStorageProvider
{
    private static readonly ConcurrentDictionary<string, byte[]> _memoryStore = new(StringComparer.OrdinalIgnoreCase);
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupabaseStorageProvider> _logger;
    private readonly IHostEnvironment? _environment;

    private readonly string _supabaseUrl;
    private readonly string? _supabaseKey;
    private readonly string _defaultBucket;
    private readonly string _storageDir;

    public SupabaseStorageProvider(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseStorageProvider> logger,
        IHostEnvironment? environment = null)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;

        var options = SupabaseStorageOptions.FromConfiguration(configuration);
        _supabaseUrl = options.Url;
        _supabaseKey = options.Key;
        _defaultBucket = options.Bucket;

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

    private string CleanStoragePath(string bucket, string objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName)) return string.Empty;

        var clean = objectName.Trim().Replace('\\', '/');
        if (clean.StartsWith("storage://", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean.Substring("storage://".Length);
        }

        clean = clean.TrimStart('/');
        var targetBucket = ResolveBucket(bucket);

        if (clean.StartsWith(targetBucket + "/", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean.Substring(targetBucket.Length + 1);
        }
        if (clean.StartsWith("sparovia-images/", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean.Substring("sparovia-images/".Length);
        }
        if (clean.StartsWith("images/", StringComparison.OrdinalIgnoreCase))
        {
            clean = clean.Substring("images/".Length);
        }

        return clean.TrimStart('/');
    }

    public async Task<string> UploadAsync(
        string bucket,
        string objectName,
        Stream data,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucket);
        var cleanPath = CleanStoragePath(bucket, objectName);
        var key = $"{targetBucket}/{cleanPath}";

        using var ms = new MemoryStream();
        if (data.CanSeek)
        {
            data.Seek(0, SeekOrigin.Begin);
        }
        await data.CopyToAsync(ms, cancellationToken);
        var bytes = ms.ToArray();

        // 1. Production or when credentials are provided: upload to Supabase Storage
        if (!string.IsNullOrWhiteSpace(_supabaseKey))
        {
            var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{targetBucket}/{cleanPath}";
            using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
            request.Headers.Add("apikey", _supabaseKey);
            request.Headers.Add("x-upsert", "true");

            var content = new ByteArrayContent(bytes);
            if (MediaTypeHeaderValue.TryParse(contentType, out var parsedMediaType))
            {
                content.Headers.ContentType = parsedMediaType;
            }
            else
            {
                content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            }
            request.Content = content;

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Supabase Storage upload failed. Bucket={Bucket}, Path={Path}, StatusCode={StatusCode}, Error={Error}",
                    targetBucket, cleanPath, (int)response.StatusCode, errorBody);

                var reason = response.StatusCode switch
                {
                    HttpStatusCode.Unauthorized => "Supabase Storage authentication failed (401). Verify SUPABASE_SERVICE_ROLE_KEY.",
                    HttpStatusCode.Forbidden => "Supabase Storage permission denied (403). Ensure SUPABASE_SERVICE_ROLE_KEY has write permissions on the bucket.",
                    HttpStatusCode.NotFound => $"Supabase Storage bucket '{targetBucket}' was not found (404).",
                    HttpStatusCode.RequestEntityTooLarge => "Supabase Storage payload too large (413).",
                    _ => $"Supabase Storage upload failed with status {(int)response.StatusCode}: {errorBody}"
                };

                throw new InvalidOperationException($"Storage upload failed: {reason}");
            }

            _logger.LogInformation("Successfully uploaded {ObjectName} to Supabase Storage bucket {Bucket}", cleanPath, targetBucket);
        }
        else if (_environment?.IsProduction() == true)
        {
            var err = "Supabase Storage credentials are missing in production. SUPABASE_SERVICE_ROLE_KEY or Supabase:Key must be configured in hosting environment.";
            _logger.LogError("{ErrorMessage}", err);
            throw new InvalidOperationException(err);
        }
        else
        {
            _logger.LogWarning("Uploading without Supabase credentials in non-production mode for {ObjectName}; saved to local/memory cache.", cleanPath);
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
        }

        // Cache in memory for instant delivery
        _memoryStore[key] = bytes;
        _memoryStore[$"{bucket}/{objectName}"] = bytes;

        return $"storage://{key}";
    }

    public async Task<Stream> DownloadAsync(
        string bucket,
        string objectName,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucket);
        var cleanPath = CleanStoragePath(bucket, objectName);
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
            var candidateUrls = new[]
            {
                $"{_supabaseUrl}/storage/v1/object/authenticated/{targetBucket}/{cleanPath}",
                $"{_supabaseUrl}/storage/v1/object/{targetBucket}/{cleanPath}"
            };

            foreach (var downloadUrl in candidateUrls)
            {
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Get, downloadUrl);
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
                    request.Headers.Add("apikey", _supabaseKey);

                    var response = await _httpClient.SendAsync(request, cancellationToken);
                    if (response.IsSuccessStatusCode)
                    {
                        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                        var ms = new MemoryStream();
                        await stream.CopyToAsync(ms, cancellationToken);
                        var downloadedBytes = ms.ToArray();

                        // Cache in memory store
                        _memoryStore[key] = downloadedBytes;

                        ms.Seek(0, SeekOrigin.Begin);
                        return ms;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Supabase Storage direct download failed for {ObjectName} via {Url}", cleanPath, downloadUrl);
                }
            }
        }

        // 2. Check local disk cache
        try
        {
            var localPath = Path.Combine(_storageDir, key.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(localPath))
            {
                var diskBytes = await File.ReadAllBytesAsync(localPath, cancellationToken);
                if (diskBytes.Length > 0)
                {
                    _memoryStore[key] = diskBytes;
                    return new MemoryStream(diskBytes);
                }
            }
        }
        catch { }

        _logger.LogWarning("Storage download: object '{ObjectName}' was not found in bucket '{Bucket}'.", cleanPath, targetBucket);
        throw new FileNotFoundException($"Object '{cleanPath}' was not found in bucket '{targetBucket}'.");
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
        var cleanPath = CleanStoragePath(bucket, objectName);

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
                    if (signedPath.StartsWith("/storage/v1", StringComparison.OrdinalIgnoreCase))
                    {
                        return $"{_supabaseUrl}{signedPath}";
                    }
                    if (signedPath.StartsWith("/"))
                    {
                        return $"{_supabaseUrl}/storage/v1{signedPath}";
                    }
                    return $"{_supabaseUrl}/storage/v1/{signedPath}";
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
        var cleanPath = CleanStoragePath(bucket, objectName);
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
                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Supabase Storage delete returned {StatusCode} for {ObjectName}", response.StatusCode, cleanPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete {ObjectName} from Supabase Storage", cleanPath);
            }
        }
    }
}
