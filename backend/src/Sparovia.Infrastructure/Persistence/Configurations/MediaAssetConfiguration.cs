using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparovia.Domain.Entities;

namespace Sparovia.Infrastructure.Persistence.Configurations;

public class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Url)
            .IsRequired()
            .HasMaxLength(1000);

        builder.HasOne(x => x.Business)
            .WithMany()
            .HasForeignKey(x => x.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
