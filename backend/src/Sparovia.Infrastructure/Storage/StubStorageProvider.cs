namespace Sparovia.Infrastructure.Storage;

using System.Collections.Concurrent;
using Sparovia.Application.Common.Interfaces;

public class StubStorageProvider : IStorageProvider
{
    private readonly ConcurrentDictionary<string, byte[]> _memoryStore = new(StringComparer.OrdinalIgnoreCase);
    private readonly string _storageDir;

    public StubStorageProvider()
    {
        // Persist to local disk so restarts do not wipe uploaded files
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

        return $"storage://{key}";
    }

    public async Task<Stream> DownloadAsync(string bucket, string objectName, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";
        if (_memoryStore.TryGetValue(key, out var bytes) && bytes.Length > 0)
        {
            return new MemoryStream(bytes);
        }

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

        return new MemoryStream();
    }

    public Task DeleteAsync(string bucket, string objectName, CancellationToken cancellationToken = default)
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

        return Task.CompletedTask;
    }
}
