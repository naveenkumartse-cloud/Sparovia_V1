using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparovia.Domain.Entities;

namespace Sparovia.Infrastructure.Persistence.Configurations;

public class WebsiteContentConfiguration : IEntityTypeConfiguration<WebsiteContent>
{
    public void Configure(EntityTypeBuilder<WebsiteContent> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SectionName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.SectionType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne(x => x.Business)
            .WithMany()
            .HasForeignKey(x => x.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
