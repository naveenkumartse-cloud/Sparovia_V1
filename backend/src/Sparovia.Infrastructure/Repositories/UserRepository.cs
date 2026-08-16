using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence;

namespace Sparovia.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly SparoviaDbContext _context;

    public UserRepository(SparoviaDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), cancellationToken);

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await _context.Users
            .AnyAsync(u => u.Email == email.Trim().ToLowerInvariant(), cancellationToken);

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
        => await _context.Users.AddAsync(user, cancellationToken);
}
