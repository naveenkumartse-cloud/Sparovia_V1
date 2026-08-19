using Sparovia.Domain.Entities;

namespace Sparovia.Application.Interfaces.Repositories;

public interface IMembershipRepository
{
    Task<Membership?> GetByUserAndBusinessAsync(Guid userId, Guid businessId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Membership>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Membership membership, CancellationToken cancellationToken = default);
    Task<bool> UserHasAccessToBusinessAsync(Guid userId, Guid businessId, CancellationToken cancellationToken = default);
}
