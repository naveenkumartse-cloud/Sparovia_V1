using Sparovia.Domain.Entities;

namespace Sparovia.Application.Interfaces.Repositories;

public interface IMediaRepository
{
    Task<MediaAsset?> GetByIdAsync(Guid id, Guid businessId, CancellationToken cancellationToken = default);
    Task<List<MediaAsset>> GetByBusinessIdAsync(Guid businessId, CancellationToken cancellationToken = default);
    Task AddAsync(MediaAsset media, CancellationToken cancellationToken = default);
    void Delete(MediaAsset media);
}
