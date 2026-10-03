using Microsoft.EntityFrameworkCore;
using Sparovia.Application.BusinessPresence;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.BusinessPresence;

public class BusinessPresenceService : IBusinessPresenceService
{
    private readonly SparoviaDbContext _dbContext;

    public BusinessPresenceService(SparoviaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private static VerifiedNapDto? MapVerifiedNap(BusinessContext? context)
    {
        if (context == null) return null;

        return new VerifiedNapDto
        {
            BusinessName = context.BusinessName,
            BusinessType = context.BusinessType,
            PrimaryCategory = context.PrimaryCategory,
            BusinessPhone = context.BusinessPhone,
            BusinessEmail = context.BusinessEmail,
            Website = context.Website,
            AddressLine1 = context.AddressLine1,
            AddressLine2 = context.AddressLine2,
            City = context.City,
            State = context.State,
            PostalCode = context.PostalCode,
            Country = context.Country,
            ServiceAreas = context.ServiceAreas,
            IsConfirmed = context.IsConfirmed,
            BusinessDescription = context.BusinessDescription,
            TargetCustomers = context.TargetCustomers,
            Differentiators = context.Differentiators,
            YearsInBusiness = context.YearsInBusiness,
            Certifications = context.Certifications,
            Awards = context.Awards,
            Accreditations = context.Accreditations,
            Warranties = context.Warranties,
            AuthorizedStatuses = context.AuthorizedStatuses,
            OtherClaims = context.OtherClaims,
            ServicesCount = context.Services?.Count ?? 0,
            ServiceNames = context.Services?.Select(s => s.ServiceName).ToList() ?? new List<string>()
        };
    }

    public async Task<BusinessPresenceDto?> GetPresenceAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        // 1. Fetch BusinessContext for canonical verified NAP projection (tenant isolated)
        var context = await _dbContext.BusinessContexts
            .Include(b => b.Services)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        // 2. Fetch or create BusinessPresence record
        var presence = await _dbContext.BusinessPresences
            .FirstOrDefaultAsync(p => p.TenantId == tenantId, cancellationToken);

        if (presence == null)
        {
            presence = new Domain.Entities.BusinessPresence
            {
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.BusinessPresences.Add(presence);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new BusinessPresenceDto
        {
            OperatingHours = presence.OperatingHours,
            PublicNotice = presence.PublicNotice,
            LastReviewedAt = presence.LastReviewedAt,
            CreatedAt = presence.CreatedAt,
            UpdatedAt = presence.UpdatedAt,
            VerifiedNap = MapVerifiedNap(context)
        };
    }

    public async Task<BusinessPresenceResult> UpdatePresenceAsync(Guid tenantId, UpdateBusinessPresenceRequest request, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .Include(b => b.Services)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        var presence = await _dbContext.BusinessPresences
            .FirstOrDefaultAsync(p => p.TenantId == tenantId, cancellationToken);

        if (presence == null)
        {
            presence = new Domain.Entities.BusinessPresence
            {
                TenantId = tenantId,
                OperatingHours = request.OperatingHours?.Trim(),
                PublicNotice = request.PublicNotice?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.BusinessPresences.Add(presence);
        }
        else
        {
            presence.OperatingHours = request.OperatingHours?.Trim();
            presence.PublicNotice = request.PublicNotice?.Trim();
            presence.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = new BusinessPresenceDto
        {
            OperatingHours = presence.OperatingHours,
            PublicNotice = presence.PublicNotice,
            LastReviewedAt = presence.LastReviewedAt,
            CreatedAt = presence.CreatedAt,
            UpdatedAt = presence.UpdatedAt,
            VerifiedNap = MapVerifiedNap(context)
        };

        return new BusinessPresenceResult
        {
            Success = true,
            Presence = dto
        };
    }

    public async Task<BusinessPresenceResult> MarkAsReviewedAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .Include(b => b.Services)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        var presence = await _dbContext.BusinessPresences
            .FirstOrDefaultAsync(p => p.TenantId == tenantId, cancellationToken);

        var now = DateTime.UtcNow;

        if (presence == null)
        {
            presence = new Domain.Entities.BusinessPresence
            {
                TenantId = tenantId,
                LastReviewedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.BusinessPresences.Add(presence);
        }
        else
        {
            presence.LastReviewedAt = now;
            presence.UpdatedAt = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = new BusinessPresenceDto
        {
            OperatingHours = presence.OperatingHours,
            PublicNotice = presence.PublicNotice,
            LastReviewedAt = presence.LastReviewedAt,
            CreatedAt = presence.CreatedAt,
            UpdatedAt = presence.UpdatedAt,
            VerifiedNap = MapVerifiedNap(context)
        };

        return new BusinessPresenceResult
        {
            Success = true,
            Presence = dto
        };
    }
}
