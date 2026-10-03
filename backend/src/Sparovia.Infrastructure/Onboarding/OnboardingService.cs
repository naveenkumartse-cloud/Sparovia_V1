using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Onboarding;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.Onboarding;

public class OnboardingService : IOnboardingService
{
    private readonly SparoviaDbContext _dbContext;

    private static readonly string[] AllowedBusinessTypes = new[]
    {
        // Standard Operating Types (PILOT_V1_DOMAIN_DATA_MODEL / PILOT_V1_UX_SCREEN_SPECIFICATION)
        "Storefront", "Service Area", "Hybrid", "Online", "Other",

        // Backward compatibility types
        "Retail", "Technology", "Healthcare", "Hospitality", 
        "Construction", "Services", "Manufacturing",
        "Local Service Business", "Contractor / Trades", "Retail / Storefront",
        "Professional Practice", "Hospitality / Food & Beverage",
        "Studio / Creative Agency", "Healthcare / Clinic", "Other Commercial Business"
    };

    public OnboardingService(SparoviaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BusinessBasicsDto?> GetBusinessBasicsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null) return null;

        return new BusinessBasicsDto
        {
            BusinessName = context.BusinessName,
            BusinessType = context.BusinessType,
            PrimaryCategory = context.PrimaryCategory,
            BusinessPhone = context.BusinessPhone,
            BusinessEmail = context.BusinessEmail,
            Website = context.Website
        };
    }

    public async Task<BusinessBasicsResult> SaveBusinessBasicsAsync(Guid tenantId, BusinessBasicsDto dto, CancellationToken cancellationToken = default)
    {
        // 1. Validation
        if (!AllowedBusinessTypes.Contains(dto.BusinessType))
        {
            return new BusinessBasicsResult { Success = false, ErrorMessage = "Invalid Business Type selected." };
        }

        if (!string.IsNullOrWhiteSpace(dto.Website))
        {
            if (!Uri.TryCreate(dto.Website, UriKind.Absolute, out var uri) || 
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return new BusinessBasicsResult { Success = false, ErrorMessage = "Website must be a valid HTTP or HTTPS URL." };
            }
        }

        // 2. Fetch or Create
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null)
        {
            context = new BusinessContext
            {
                TenantId = tenantId,
                BusinessName = dto.BusinessName.Trim(),
                BusinessType = dto.BusinessType,
                PrimaryCategory = dto.PrimaryCategory.Trim(),
                BusinessPhone = dto.BusinessPhone?.Trim(),
                BusinessEmail = dto.BusinessEmail.Trim(),
                Website = dto.Website?.Trim()
            };
            _dbContext.BusinessContexts.Add(context);
        }
        else
        {
            context.BusinessName = dto.BusinessName.Trim();
            context.BusinessType = dto.BusinessType;
            context.PrimaryCategory = dto.PrimaryCategory.Trim();
            context.BusinessPhone = dto.BusinessPhone?.Trim();
            context.BusinessEmail = dto.BusinessEmail.Trim();
            context.Website = dto.Website?.Trim();
            context.UpdatedAt = DateTime.UtcNow;
        }

        // Invalidate confirmation if data changes
        context.IsConfirmed = false;
        context.ConfirmedAt = null;
        context.ConfirmedByUserId = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new BusinessBasicsResult { Success = true };
    }

    public async Task<List<ServiceDto>> GetServicesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var services = await _dbContext.Services
            .Where(s => s.BusinessContext!.TenantId == tenantId)
            .OrderBy(s => s.CreatedAt)
            .Select(s => new ServiceDto
            {
                Id = s.Id,
                ServiceName = s.ServiceName,
                ServiceDescription = s.ServiceDescription
            })
            .ToListAsync(cancellationToken);

        return services;
    }

    public async Task<ServiceResult> AddServiceAsync(Guid tenantId, AddServiceRequest request, CancellationToken cancellationToken = default)
    {
        var businessContext = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (businessContext == null)
        {
            return new ServiceResult { Success = false, ErrorMessage = "Business context not found. Please complete Business Basics first." };
        }

        var service = new Service
        {
            ServiceName = request.ServiceName.Trim(),
            ServiceDescription = request.ServiceDescription?.Trim(),
            BusinessContextId = businessContext.Id
        };

        _dbContext.Services.Add(service);

        // Invalidate confirmation if data changes
        businessContext.IsConfirmed = false;
        businessContext.ConfirmedAt = null;
        businessContext.ConfirmedByUserId = null;
        businessContext.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ServiceResult 
        { 
            Success = true, 
            Service = new ServiceDto 
            {
                Id = service.Id,
                ServiceName = service.ServiceName,
                ServiceDescription = service.ServiceDescription
            }
        };
    }

    public async Task<ServiceResult> UpdateServiceAsync(Guid tenantId, Guid serviceId, UpdateServiceRequest request, CancellationToken cancellationToken = default)
    {
        var service = await _dbContext.Services
            .Include(s => s.BusinessContext)
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.BusinessContext!.TenantId == tenantId, cancellationToken);

        if (service == null)
        {
            return new ServiceResult { Success = false, ErrorMessage = "Service not found or access denied." };
        }

        service.ServiceName = request.ServiceName.Trim();
        service.ServiceDescription = request.ServiceDescription?.Trim();
        service.UpdatedAt = DateTime.UtcNow;

        if (service.BusinessContext != null)
        {
            service.BusinessContext.IsConfirmed = false;
            service.BusinessContext.ConfirmedAt = null;
            service.BusinessContext.ConfirmedByUserId = null;
            service.BusinessContext.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ServiceResult 
        { 
            Success = true, 
            Service = new ServiceDto 
            {
                Id = service.Id,
                ServiceName = service.ServiceName,
                ServiceDescription = service.ServiceDescription
            }
        };
    }

    public async Task<ServiceResult> DeleteServiceAsync(Guid tenantId, Guid serviceId, CancellationToken cancellationToken = default)
    {
        var service = await _dbContext.Services
            .Include(s => s.BusinessContext)
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.BusinessContext!.TenantId == tenantId, cancellationToken);

        if (service == null)
        {
            return new ServiceResult { Success = false, ErrorMessage = "Service not found or access denied." };
        }

        _dbContext.Services.Remove(service);

        if (service.BusinessContext != null)
        {
            service.BusinessContext.IsConfirmed = false;
            service.BusinessContext.ConfirmedAt = null;
            service.BusinessContext.ConfirmedByUserId = null;
            service.BusinessContext.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ServiceResult { Success = true };
    }

    public async Task<LocationAndCustomersDto?> GetLocationAndCustomersAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null) return null;

        return new LocationAndCustomersDto
        {
            AddressLine1 = context.AddressLine1,
            AddressLine2 = context.AddressLine2,
            City = context.City,
            State = context.State,
            PostalCode = context.PostalCode,
            Country = context.Country,
            ServiceAreas = context.ServiceAreas,
            TargetCustomers = context.TargetCustomers
        };
    }

    public async Task<LocationAndCustomersResult> SaveLocationAndCustomersAsync(Guid tenantId, LocationAndCustomersDto dto, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null)
        {
            return new LocationAndCustomersResult { Success = false, ErrorMessage = "Business context not found. Please complete Business Basics first." };
        }

        context.AddressLine1 = dto.AddressLine1?.Trim();
        context.AddressLine2 = dto.AddressLine2?.Trim();
        context.City = dto.City?.Trim();
        context.State = dto.State?.Trim();
        context.PostalCode = dto.PostalCode?.Trim();
        context.Country = dto.Country?.Trim();
        
        context.ServiceAreas = dto.ServiceAreas?
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct()
            .ToList() ?? new List<string>();

        context.TargetCustomers = dto.TargetCustomers?
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct()
            .ToList() ?? new List<string>();

        context.UpdatedAt = DateTime.UtcNow;

        // Invalidate confirmation if data changes
        context.IsConfirmed = false;
        context.ConfirmedAt = null;
        context.ConfirmedByUserId = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LocationAndCustomersResult { Success = true };
    }

    public async Task<BusinessDescriptionDto?> GetBusinessDescriptionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null) return null;

        return new BusinessDescriptionDto
        {
            BusinessDescription = context.BusinessDescription,
            Differentiators = context.Differentiators
        };
    }

    public async Task<BusinessDescriptionResult> SaveBusinessDescriptionAsync(Guid tenantId, BusinessDescriptionDto dto, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null)
        {
            return new BusinessDescriptionResult { Success = false, ErrorMessage = "Business context not found. Please complete Business Basics first." };
        }

        context.BusinessDescription = dto.BusinessDescription?.Trim();
        context.Differentiators = dto.Differentiators?.Trim();

        context.UpdatedAt = DateTime.UtcNow;

        // Invalidate confirmation if data changes
        context.IsConfirmed = false;
        context.ConfirmedAt = null;
        context.ConfirmedByUserId = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new BusinessDescriptionResult { Success = true };
    }

    private List<string>? CleanStringList(List<string>? list)
    {
        if (list == null) return null;
        var cleaned = list.Where(s => !string.IsNullOrWhiteSpace(s))
                          .Select(s => s.Trim())
                          .Distinct()
                          .ToList();
        return cleaned.Count > 0 ? cleaned : null;
    }

    public async Task<ApprovedFactsDto?> GetApprovedFactsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null) return null;

        return new ApprovedFactsDto
        {
            YearsInBusiness = context.YearsInBusiness,
            Certifications = context.Certifications,
            Awards = context.Awards,
            Accreditations = context.Accreditations,
            Warranties = context.Warranties,
            AuthorizedStatuses = context.AuthorizedStatuses,
            OtherClaims = context.OtherClaims
        };
    }

    public async Task<ApprovedFactsResult> SaveApprovedFactsAsync(Guid tenantId, ApprovedFactsDto dto, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null)
        {
            return new ApprovedFactsResult { Success = false, ErrorMessage = "Business context not found. Please complete Business Basics first." };
        }

        context.YearsInBusiness = dto.YearsInBusiness;
        
        context.Certifications = CleanStringList(dto.Certifications);
        context.Awards = CleanStringList(dto.Awards);
        context.Accreditations = CleanStringList(dto.Accreditations);
        context.Warranties = CleanStringList(dto.Warranties);
        context.AuthorizedStatuses = CleanStringList(dto.AuthorizedStatuses);
        context.OtherClaims = CleanStringList(dto.OtherClaims);

        context.UpdatedAt = DateTime.UtcNow;

        // Invalidate confirmation if data changes
        context.IsConfirmed = false;
        context.ConfirmedAt = null;
        context.ConfirmedByUserId = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ApprovedFactsResult { Success = true };
    }

    public async Task<BusinessContextSummaryDto?> GetBusinessContextSummaryAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .Include(b => b.Services)
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null) return null;

        return new BusinessContextSummaryDto
        {
            IsConfirmed = context.IsConfirmed,
            BusinessName = context.BusinessName,
            BusinessType = context.BusinessType,
            PrimaryCategory = context.PrimaryCategory,
            BusinessPhone = context.BusinessPhone,
            BusinessEmail = context.BusinessEmail,
            Website = context.Website,
            
            Services = context.Services.Select(s => new ServiceDto
            {
                Id = s.Id,
                ServiceName = s.ServiceName,
                ServiceDescription = s.ServiceDescription
            }).ToList(),

            AddressLine1 = context.AddressLine1,
            AddressLine2 = context.AddressLine2,
            City = context.City,
            State = context.State,
            PostalCode = context.PostalCode,
            Country = context.Country,
            ServiceAreas = context.ServiceAreas,
            TargetCustomers = context.TargetCustomers,

            BusinessDescription = context.BusinessDescription,
            Differentiators = context.Differentiators,

            YearsInBusiness = context.YearsInBusiness,
            Certifications = context.Certifications,
            Awards = context.Awards,
            Accreditations = context.Accreditations,
            Warranties = context.Warranties,
            AuthorizedStatuses = context.AuthorizedStatuses,
            OtherClaims = context.OtherClaims
        };
    }

    public async Task<ConfirmationResult> ConfirmBusinessContextAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken = default)
    {
        var context = await _dbContext.BusinessContexts
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (context == null)
        {
            return new ConfirmationResult { Success = false, ErrorMessage = "Business context not found." };
        }

        if (context.IsConfirmed)
        {
            return new ConfirmationResult { Success = true }; // Idempotent
        }

        // Basic validation: must have at least Business Basics filled out conceptually to be confirmed.
        if (string.IsNullOrWhiteSpace(context.BusinessName))
        {
            return new ConfirmationResult { Success = false, ErrorMessage = "Business information is incomplete and cannot be confirmed." };
        }

        context.IsConfirmed = true;
        context.ConfirmedAt = DateTime.UtcNow;
        context.ConfirmedByUserId = userId;
        context.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Audit Record can be hooked up here following architecture
        // _auditService.RecordAsync(userId, tenantId, "BusinessContextConfirmed");

        return new ConfirmationResult { Success = true };
    }
}
