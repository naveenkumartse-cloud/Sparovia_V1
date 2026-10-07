namespace Sparovia.Application.Common.Interfaces;

public interface IStorageProvider
{
    Task<string> UploadAsync(string bucket, string objectName, Stream data, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(string bucket, string objectName, CancellationToken cancellationToken = default);
    Task DeleteAsync(string bucket, string objectName, CancellationToken cancellationToken = default);
    Task<string?> GetSignedUrlAsync(string bucket, string objectName, TimeSpan expiresIn, CancellationToken cancellationToken = default);
}
