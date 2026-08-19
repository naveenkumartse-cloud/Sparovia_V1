namespace Sparovia.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string directory, CancellationToken cancellationToken = default);
    void DeleteFile(string fileUrl);
}
