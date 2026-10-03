namespace Sparovia.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;

public class SparoviaDbContext : DbContext
{
    public SparoviaDbContext(DbContextOptions<SparoviaDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<BusinessContext> BusinessContexts => Set<BusinessContext>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<BusinessPresence> BusinessPresences => Set<BusinessPresence>();
    public DbSet<Website> Websites => Set<Website>();
    public DbSet<WebsiteContent> WebsiteContents => Set<WebsiteContent>();
    public DbSet<AIRequest> AIRequests => Set<AIRequest>();
    public DbSet<TenantAIConfiguration> TenantAIConfigurations => Set<TenantAIConfiguration>();
    public DbSet<Image> Images => Set<Image>();
    public DbSet<ImageVariant> ImageVariants => Set<ImageVariant>();
    public DbSet<WebsiteWorkCategory> WebsiteWorkCategories => Set<WebsiteWorkCategory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.NormalizedEmail).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.NormalizedEmail).IsRequired().HasMaxLength(256);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(256);
            entity.Property(e => e.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
        });

        modelBuilder.Entity<Membership>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.TenantId }).IsUnique();
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.Memberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Memberships)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BusinessContext>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId).IsUnique(); // 1-to-1
            
            entity.Property(e => e.BusinessName).IsRequired().HasMaxLength(256);
            entity.Property(e => e.BusinessType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PrimaryCategory).IsRequired().HasMaxLength(100);
            entity.Property(e => e.BusinessPhone).HasMaxLength(30);
            entity.Property(e => e.BusinessEmail).IsRequired().HasMaxLength(256);
            entity.Property(e => e.Website).HasMaxLength(256);

            entity.Property(e => e.AddressLine1).HasMaxLength(256);
            entity.Property(e => e.AddressLine2).HasMaxLength(256);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.PostalCode).HasMaxLength(50);
            entity.Property(e => e.Country).HasMaxLength(100);

            entity.Property(e => e.BusinessDescription).HasMaxLength(4000);
            entity.Property(e => e.Differentiators).HasMaxLength(4000);

            entity.HasOne(e => e.Tenant)
                .WithOne(t => t.BusinessContext)
                .HasForeignKey<BusinessContext>(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ServiceName).IsRequired().HasMaxLength(256);
            entity.Property(e => e.ServiceDescription).HasMaxLength(2000);

            entity.HasOne(e => e.BusinessContext)
                .WithMany(b => b.Services)
                .HasForeignKey(e => e.BusinessContextId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BusinessPresence>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId).IsUnique(); // 1-to-1 with Tenant

            entity.Property(e => e.OperatingHours).HasMaxLength(2000);
            entity.Property(e => e.PublicNotice).HasMaxLength(1000);

            entity.HasOne(e => e.Tenant)
                .WithOne(t => t.BusinessPresence)
                .HasForeignKey<BusinessPresence>(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Website>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId).IsUnique(); // 1-to-1 with Tenant in Pilot V1
            entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
            entity.Property(e => e.Domain).IsRequired().HasMaxLength(256);
            entity.Property(e => e.ConnectionStatus).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TemplateId).IsRequired().HasMaxLength(100).HasDefaultValue("kvn-interiors-v1");

            entity.HasOne(e => e.Tenant)
                .WithOne(t => t.Website)
                .HasForeignKey<Website>(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WebsiteContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.WebsiteId, e.SectionKey }).IsUnique();
            entity.Property(e => e.SectionKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DraftContentJson).IsRequired();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.WebsiteContents)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Website)
                .WithMany(w => w.Contents)
                .HasForeignKey(e => e.WebsiteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AIRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.Status });
            entity.HasIndex(e => new { e.TenantId, e.ReviewStatus });
            entity.HasIndex(e => new { e.TenantId, e.ResourceType, e.ResourceId });
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.OperationType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ResourceType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ReviewStatus).IsRequired().HasMaxLength(50).HasDefaultValue(AIReviewStatus.PendingReview);
            entity.Property(e => e.OutputText).HasMaxLength(8000);
            entity.Property(e => e.OriginalText).HasMaxLength(8000);
            entity.Property(e => e.TargetSectionKey).HasMaxLength(100);
            entity.Property(e => e.TargetFieldKey).HasMaxLength(100);
            entity.Property(e => e.ProviderReference).HasMaxLength(100);
            entity.Property(e => e.ModelReference).HasMaxLength(100);
            entity.Property(e => e.ContextVersion).HasMaxLength(100);
            entity.Property(e => e.ErrorCode).HasMaxLength(100);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.AIRequests)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ReviewedByUser)
                .WithMany()
                .HasForeignKey(e => e.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TenantAIConfiguration>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId).IsUnique(); // 1-to-1 with Tenant

            entity.Property(e => e.ProviderKey).IsRequired().HasMaxLength(50).HasDefaultValue(AIProviders.OpenAI);
            entity.Property(e => e.EncryptedApiKey).HasMaxLength(2000);
            entity.Property(e => e.MaskedApiKey).HasMaxLength(100);
            entity.Property(e => e.SelectedModelKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SupportedCapability).IsRequired().HasMaxLength(50).HasDefaultValue(AIModelCapability.Content);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue(AIConnectionStatus.NotConnected);
            entity.Property(e => e.UpdatedAt).IsConcurrencyToken();

            entity.HasOne(e => e.Tenant)
                .WithOne(t => t.AIConfiguration)
                .HasForeignKey<TenantAIConfiguration>(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.UpdatedByUser)
                .WithMany()
                .HasForeignKey(e => e.UpdatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Image>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.WebsiteId });
            entity.HasIndex(e => new { e.TenantId, e.UsageType });
            entity.HasIndex(e => new { e.TenantId, e.Slot });
            entity.HasIndex(e => new { e.TenantId, e.Status });
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.StorageKey).IsRequired().HasMaxLength(500);
            entity.Property(e => e.OriginalFileName).HasMaxLength(256);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UsageType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Slot).HasMaxLength(100);
            entity.Property(e => e.ProjectWorkName).HasMaxLength(200);
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.Caption).HasMaxLength(1000);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Uploaded");
            entity.Property(e => e.IsActiveWebsiteUsage).IsRequired().HasDefaultValue(true);
            entity.HasIndex(e => new { e.TenantId, e.Category });

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Images)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Website)
                .WithMany(w => w.Images)
                .HasForeignKey(e => e.WebsiteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImageVariant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.ImageId);
            entity.HasIndex(e => new { e.ImageId, e.VariantType });
            entity.HasIndex(e => new { e.ImageId, e.Status });
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.VariantType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Operation).HasMaxLength(100);
            entity.Property(e => e.StorageKey).IsRequired().HasMaxLength(500);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Processing");

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Image)
                .WithMany(i => i.Variants)
                .HasForeignKey(e => e.ImageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParentVariant)
                .WithMany()
                .HasForeignKey(e => e.ParentVariantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<WebsiteWorkCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.WebsiteId });
            entity.HasIndex(e => new { e.TenantId, e.Slug });

            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Website)
                .WithMany()
                .HasForeignKey(e => e.WebsiteId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
