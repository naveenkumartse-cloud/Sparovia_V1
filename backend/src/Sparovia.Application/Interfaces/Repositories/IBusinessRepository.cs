using Sparovia.Domain.Entities;

namespace Sparovia.Application.Interfaces.Repositories;

public interface IBusinessRepository
{
    Task<Business?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Business?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task AddAsync(Business business, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Business>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
