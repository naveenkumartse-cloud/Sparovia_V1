using Sparovia.Application.Common.Interfaces;

namespace Sparovia.Infrastructure.Storage;

public class LocalStorageService : IStorageService
{
    private readonly string _storagePath;
    private readonly string _baseUrl;

    public LocalStorageService()
    {
        // For development, we store files in a local directory
        _storagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        _baseUrl = "/uploads";
        
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    public async Task<string> UploadFileAsync(string tenantId, string fileName, Stream fileStream, string contentType, CancellationToken cancellationToken = default)
    {
        var tenantPath = Path.Combine(_storagePath, tenantId);
        if (!Directory.Exists(tenantPath))
        {
            Directory.CreateDirectory(tenantPath);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(tenantPath, uniqueFileName);

        using var fileStreamToWrite = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true);
        await fileStream.CopyToAsync(fileStreamToWrite, cancellationToken);

        return $"{_baseUrl}/{tenantId}/{uniqueFileName}";
    }

    public Task DeleteFileAsync(string tenantId, string filePath, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_storagePath, tenantId, Path.GetFileName(filePath));
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
        return Task.CompletedTask;
    }

    public Task<string> GetFileUrlAsync(string tenantId, string filePath, CancellationToken cancellationToken = default)
    {
        var fileName = Path.GetFileName(filePath);
        return Task.FromResult($"{_baseUrl}/{tenantId}/{fileName}");
    }
}
