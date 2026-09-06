namespace Sparovia.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadFileAsync(string tenantId, string fileName, Stream fileStream, string contentType, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string tenantId, string filePath, CancellationToken cancellationToken = default);
    Task<string> GetFileUrlAsync(string tenantId, string filePath, CancellationToken cancellationToken = default);
}
