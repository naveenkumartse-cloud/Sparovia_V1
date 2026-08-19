using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparovia.Domain.Entities;

namespace Sparovia.Infrastructure.Persistence.Configurations;

public class BusinessConfiguration : IEntityTypeConfiguration<Business>
{
    public void Configure(EntityTypeBuilder<Business> builder)
    {
        builder.ToTable("businesses");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id");

        builder.Property(b => b.Name)
            .HasColumnName("name")
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.Slug)
            .HasColumnName("slug")
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(b => b.Slug)
            .IsUnique()
            .HasDatabaseName("ix_businesses_slug");

        builder.Property(b => b.Industry)
            .HasColumnName("industry")
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.Description)
            .HasColumnName("description")
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(b => b.IsActive)
            .HasColumnName("is_active")
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(b => b.IsOnboardingComplete)
            .HasColumnName("is_onboarding_complete")
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(b => b.TargetAudience)
            .HasColumnName("target_audience")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(b => b.ValueProposition)
            .HasColumnName("value_proposition")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(b => b.ContactEmail)
            .HasColumnName("contact_email")
            .HasMaxLength(255)
            .IsRequired(false);

        builder.Property(b => b.ContactPhone)
            .HasColumnName("contact_phone")
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(b => b.Address)
            .HasColumnName("address")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(b => b.HasGoogleBusinessProfile)
            .HasColumnName("has_google_business_profile")
            .IsRequired(false);

        builder.Property(b => b.GoogleBusinessProfileStatus)
            .HasColumnName("google_business_profile_status")
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(b => b.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasMany(b => b.Memberships)
            .WithOne(m => m.Business)
            .HasForeignKey(m => m.BusinessId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
