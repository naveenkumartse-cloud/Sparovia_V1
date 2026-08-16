using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence;

namespace Sparovia.Infrastructure.Repositories;

public class MembershipRepository : IMembershipRepository
{
    private readonly SparoviaDbContext _context;

    public MembershipRepository(SparoviaDbContext context)
    {
        _context = context;
    }

    public async Task<Membership?> GetByUserAndBusinessAsync(
        Guid userId, Guid businessId,
        CancellationToken cancellationToken = default)
        => await _context.Memberships.AsNoTracking()
            .FirstOrDefaultAsync(m => m.UserId == userId && m.BusinessId == businessId, cancellationToken);

    public async Task<IReadOnlyList<Membership>> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
        => await _context.Memberships.AsNoTracking()
            .Where(m => m.UserId == userId)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(Membership membership, CancellationToken cancellationToken = default)
        => await _context.Memberships.AddAsync(membership, cancellationToken);

    public async Task<bool> UserHasAccessToBusinessAsync(
        Guid userId, Guid businessId,
        CancellationToken cancellationToken = default)
        => await _context.Memberships
            .AnyAsync(m => m.UserId == userId && m.BusinessId == businessId, cancellationToken);
}
