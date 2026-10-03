namespace Sparovia.Infrastructure.Storage;

using System.Collections.Concurrent;
using Sparovia.Application.Common.Interfaces;

public class StubStorageProvider : IStorageProvider
{
    private readonly ConcurrentDictionary<string, byte[]> _memoryStore = new(StringComparer.OrdinalIgnoreCase);

    public async Task<string> UploadAsync(string bucket, string objectName, Stream data, string contentType, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";
        using var ms = new MemoryStream();
        if (data.CanSeek)
        {
            data.Seek(0, SeekOrigin.Begin);
        }
        await data.CopyToAsync(ms, cancellationToken);
        _memoryStore[key] = ms.ToArray();
        return $"storage://{key}";
    }

    public Task<Stream> DownloadAsync(string bucket, string objectName, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";
        if (_memoryStore.TryGetValue(key, out var bytes))
        {
            return Task.FromResult<Stream>(new MemoryStream(bytes));
        }

        return Task.FromResult<Stream>(new MemoryStream());
    }

    public Task DeleteAsync(string bucket, string objectName, CancellationToken cancellationToken = default)
    {
        var key = $"{bucket}/{objectName}";
        _memoryStore.TryRemove(key, out _);
        return Task.CompletedTask;
    }
}
