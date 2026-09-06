using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Domain.Entities;

namespace Sparovia.Infrastructure.Persistence;

public class SparoviaDbContext : DbContext, IApplicationDbContext
{
    public DbSet<User> Users => Set<User>();

    IQueryable<User> IApplicationDbContext.Users => Users;

    public void AddUser(User user)
    {
        Users.Add(user);
    }

    public SparoviaDbContext(DbContextOptions<SparoviaDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(SparoviaDbContext).Assembly);
    }
}
