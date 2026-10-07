namespace Sparovia.Infrastructure.Storage;

using System.Collections.Concurrent;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Sparovia.Application.Common.Interfaces;

public class StubStorageProvider : IStorageProvider
{
    private readonly ConcurrentDictionary<string, byte[]> _memoryStore = new(StringComparer.OrdinalIgnoreCase);
    private readonly string _storageDir;
    private readonly string? _connectionString;

    public StubStorageProvider(IConfiguration? configuration = null)
    {
        // Persist to local disk cache
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
        catch
        {
            // Fallback to memory-only if directory creation fails
        }

        // Connection string for persistent database-backed blob storage in PostgreSQL
        _connectionString = configuration?.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
    }

    private string GetFilePath(string key)
    {
        var safeKey = key.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        return Path.Combine(_storageDir, safeKey);
    }

    public async Task<string> UploadAsync(string bucket, string objectName, Stream data, string contentType, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";
        using var ms = new MemoryStream();
        if (data.CanSeek)
        {
            data.Seek(0, SeekOrigin.Begin);
        }
        await data.CopyToAsync(ms, cancellationToken);
        var bytes = ms.ToArray();
        _memoryStore[key] = bytes;

        // 1. Write to local disk cache
        try
        {
            var filePath = GetFilePath(key);
            var parentDir = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir))
            {
                Directory.CreateDirectory(parentDir);
            }
            await File.WriteAllBytesAsync(filePath, bytes, cancellationToken);
        }
        catch
        {
            // Memory store still holds the bytes
        }

        // 2. Persist to PostgreSQL database so Render container restarts never lose files
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
                cmd.Parameters.AddWithValue("bucket", bucket);
                cmd.Parameters.AddWithValue("contentType", contentType);
                cmd.Parameters.AddWithValue("data", bytes);
                cmd.Parameters.AddWithValue("now", DateTime.UtcNow);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch
            {
                // Fallback to disk/memory store
            }
        }

        return $"storage://{key}";
    }

    public async Task<Stream> DownloadAsync(string bucket, string objectName, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";

        // 1. Check in-memory store
        if (_memoryStore.TryGetValue(key, out var bytes) && bytes.Length > 0)
        {
            return new MemoryStream(bytes);
        }

        // 2. Check local disk cache
        try
        {
            var filePath = GetFilePath(key);
            if (File.Exists(filePath))
            {
                var diskBytes = await File.ReadAllBytesAsync(filePath, cancellationToken);
                if (diskBytes.Length > 0)
                {
                    _memoryStore[key] = diskBytes;
                    return new MemoryStream(diskBytes);
                }
            }
        }
        catch
        {
            // Disk read failure
        }

        // 3. Query PostgreSQL StorageBlobs table
        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync(cancellationToken);
                var possibleKeys = new[] { key, $"images/{objectName}", objectName };
                foreach (var tryKey in possibleKeys)
                {
                    var sql = @"SELECT ""Data"" FROM ""StorageBlobs"" WHERE ""Key"" = @key LIMIT 1;";
                    await using var cmd = new NpgsqlCommand(sql, conn);
                    cmd.Parameters.AddWithValue("key", tryKey);
                    var result = await cmd.ExecuteScalarAsync(cancellationToken);
                    if (result is byte[] dbBytes && dbBytes.Length > 0)
                    {
                        _memoryStore[key] = dbBytes;
                        try
                        {
                            var filePath = GetFilePath(key);
                            var parentDir = Path.GetDirectoryName(filePath);
                            if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir))
                            {
                                Directory.CreateDirectory(parentDir);
                            }
                            await File.WriteAllBytesAsync(filePath, dbBytes, cancellationToken);
                        }
                        catch { }
                        return new MemoryStream(dbBytes);
                    }
                }
            }
            catch
            {
                // Fallback
            }
        }

        return new MemoryStream();
    }

    public async Task DeleteAsync(string bucket, string objectName, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";
        _memoryStore.TryRemove(key, out _);

        try
        {
            var filePath = GetFilePath(key);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch
        {
            // Ignore
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
                cmd.Parameters.AddWithValue("altKey", objectName);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch
            {
                // Ignore
            }
        }
    }

    public Task<string?> GetSignedUrlAsync(string bucket, string objectName, TimeSpan expiresIn, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<string?>(null);
    }
}
