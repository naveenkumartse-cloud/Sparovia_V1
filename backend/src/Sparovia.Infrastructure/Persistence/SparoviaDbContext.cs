using Microsoft.EntityFrameworkCore;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence.Configurations;

namespace Sparovia.Infrastructure.Persistence;

public class SparoviaDbContext : DbContext
{
    public SparoviaDbContext(DbContextOptions<SparoviaDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<WebsiteContent> WebsiteContents => Set<WebsiteContent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new BusinessConfiguration());
        modelBuilder.ApplyConfiguration(new MembershipConfiguration());
        modelBuilder.ApplyConfiguration(new LeadConfiguration());
        modelBuilder.ApplyConfiguration(new MediaAssetConfiguration());
        modelBuilder.ApplyConfiguration(new WebsiteContentConfiguration());
    }
}
