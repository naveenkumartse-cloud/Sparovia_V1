using Sparovia.Domain.Entities;

namespace Sparovia.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    // Keeping Application independent of EF Core types if desired, but we can expose IQueryable.
    IQueryable<User> Users { get; }
    void AddUser(User user);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
