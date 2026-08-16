using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence;

namespace Sparovia.Infrastructure.Repositories;

public class BusinessRepository : IBusinessRepository
{
    private readonly SparoviaDbContext _context;

    public BusinessRepository(SparoviaDbContext context)
    {
        _context = context;
    }

    public async Task<Business?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Businesses.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task<Business?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
        => await _context.Businesses.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Slug == slug.ToLowerInvariant(), cancellationToken);

    public async Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken = default)
        => await _context.Businesses
            .AnyAsync(b => b.Slug == slug.Trim().ToLowerInvariant(), cancellationToken);

    public async Task AddAsync(Business business, CancellationToken cancellationToken = default)
        => await _context.Businesses.AddAsync(business, cancellationToken);

    public async Task<IReadOnlyList<Business>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _context.Businesses
            .AsNoTracking()
            .Where(b => b.Memberships.Any(m => m.UserId == userId))
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken);
}
