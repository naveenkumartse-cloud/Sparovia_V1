using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparovia.Domain.Entities;

namespace Sparovia.Infrastructure.Persistence.Configurations;

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.Email)
            .HasMaxLength(150);

        builder.Property(x => x.Phone)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.Source)
            .HasMaxLength(50);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne(x => x.Business)
            .WithMany()
            .HasForeignKey(x => x.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
