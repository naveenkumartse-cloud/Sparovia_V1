using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sparovia.Application.Common;
using Sparovia.Application.Leads;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.Leads;

public class LeadService : ILeadService
{
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<LeadService> _logger;

    public LeadService(SparoviaDbContext dbContext, ILogger<LeadService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<LeadListResponse> GetLeadsAsync(Guid tenantId, LeadQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        // Enforce safe pagination boundaries
        var page = Math.Max(1, parameters.Page);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        // Strict tenant isolation: always filter by tenantId
        var query = _dbContext.Leads
            .AsNoTracking()
            .Where(l => l.TenantId == tenantId);

        // Status filter
        if (!string.IsNullOrWhiteSpace(parameters.Status) && !string.Equals(parameters.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            var filterStatus = parameters.Status.Trim();
            if (LeadStatus.IsValid(filterStatus))
            {
                query = query.Where(l => l.Status == filterStatus);
            }
        }

        // Source filter
        if (!string.IsNullOrWhiteSpace(parameters.Source) && !string.Equals(parameters.Source, "All", StringComparison.OrdinalIgnoreCase))
        {
            var filterSource = parameters.Source.Trim();
            if (LeadSource.IsValid(filterSource))
            {
                query = query.Where(l => l.Source == filterSource);
            }
        }

        // Search query (safe name, phone, email filtering within tenant boundary)
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(l =>
                l.Name.ToLower().Contains(search) ||
                l.Phone.Contains(search) ||
                (l.Email != null && l.Email.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Sort: default to newest submitted first
        query = parameters.Sort?.ToLowerInvariant() switch
        {
            "oldest" => query.OrderBy(l => l.SubmittedAt),
            "updated" => query.OrderByDescending(l => l.UpdatedAt),
            "name" => query.OrderBy(l => l.Name),
            _ => query.OrderByDescending(l => l.SubmittedAt)
        };

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LeadDto
            {
                Id = l.Id,
                Name = l.Name,
                Phone = l.Phone,
                Email = l.Email,
                Message = l.Message,
                Source = l.Source,
                Status = l.Status,
                SourceReference = l.SourceReference,
                SubmittedAt = l.SubmittedAt,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new LeadListResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<LeadDto?> GetLeadByIdAsync(Guid tenantId, Guid leadId, CancellationToken cancellationToken = default)
    {
        // Tenant boundary strictly checked in query
        var lead = await _dbContext.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == leadId && l.TenantId == tenantId, cancellationToken);

        if (lead == null)
        {
            return null;
        }

        return new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        };
    }

    public async Task<LeadOperationResult> CreateManualLeadAsync(
        Guid tenantId,
        CreateLeadRequest request,
        Guid? createdByUserId,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Customer name is required.");
        }
        if (name.Length > 256)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Customer name must not exceed 256 characters.");
        }

        var rawPhone = request.Phone?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawPhone))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Phone number is required.");
        }

        var normalizedPhone = PhoneNumberHelper.Normalize(rawPhone);
        if (normalizedPhone == null)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Invalid phone number format. Please provide a valid phone number.");
        }

        string? email = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var trimmedEmail = request.Email.Trim();
            if (trimmedEmail.Length > 256 || !trimmedEmail.Contains('@') || !trimmedEmail.Contains('.'))
            {
                return LeadOperationResult.Fail("VALIDATION_ERROR", "Please provide a valid email address.");
            }
            email = trimmedEmail.ToLowerInvariant();
        }

        var message = request.Message?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(message))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Message is required.");
        }
        if (message.Length > 4000)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Message must not exceed 4000 characters.");
        }

        var source = LeadSource.Website;
        if (!string.IsNullOrWhiteSpace(request.Source) && LeadSource.IsValid(request.Source))
        {
            source = request.Source.Trim();
        }

        var status = LeadStatus.New;
        if (!string.IsNullOrWhiteSpace(request.Status) && LeadStatus.IsValid(request.Status))
        {
            status = request.Status.Trim();
        }

        var now = DateTime.UtcNow;
        var lead = new Lead
        {
            TenantId = tenantId,
            Name = name,
            Phone = normalizedPhone,
            Email = email,
            Message = message,
            Source = source,
            Status = status,
            SubmittedAt = now,
            CreatedAt = now,
            UpdatedAt = now,
            UpdatedByUserId = createdByUserId
        };

        _dbContext.Leads.Add(lead);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: LEAD_CREATED_MANUAL. TenantId={TenantId}, LeadId={LeadId}, Source={Source}, Status={Status}, UserId={UserId}",
            tenantId, lead.Id, lead.Source, lead.Status, createdByUserId);

        var dto = new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        };

        return LeadOperationResult.Ok(dto);
    }

    public async Task<LeadOperationResult> UpdateLeadAsync(
        Guid tenantId,
        Guid leadId,
        UpdateLeadRequest request,
        Guid? updatedByUserId,
        CancellationToken cancellationToken = default)
    {
        var lead = await _dbContext.Leads
            .FirstOrDefaultAsync(l => l.Id == leadId && l.TenantId == tenantId, cancellationToken);

        if (lead == null)
        {
            _logger.LogWarning("AUDIT: LEAD_ACCESS_DENIED. LeadId={LeadId}, TenantId={TenantId}", leadId, tenantId);
            return LeadOperationResult.Fail("NOT_FOUND", "Lead not found.");
        }

        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Customer name is required.");
        }
        if (name.Length > 256)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Customer name must not exceed 256 characters.");
        }

        var rawPhone = request.Phone?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawPhone))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Phone number is required.");
        }

        var normalizedPhone = PhoneNumberHelper.Normalize(rawPhone);
        if (normalizedPhone == null)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Invalid phone number format. Please provide a valid phone number.");
        }

        string? email = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var trimmedEmail = request.Email.Trim();
            if (trimmedEmail.Length > 256 || !trimmedEmail.Contains('@') || !trimmedEmail.Contains('.'))
            {
                return LeadOperationResult.Fail("VALIDATION_ERROR", "Please provide a valid email address.");
            }
            email = trimmedEmail.ToLowerInvariant();
        }

        var message = request.Message?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(message))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Message is required.");
        }
        if (message.Length > 4000)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Message must not exceed 4000 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!LeadStatus.IsValid(request.Status))
            {
                return LeadOperationResult.Fail("VALIDATION_ERROR", "Invalid status value.");
            }
            lead.Status = request.Status.Trim();
        }

        lead.Name = name;
        lead.Phone = normalizedPhone;
        lead.Email = email;
        lead.Message = message;
        lead.UpdatedAt = DateTime.UtcNow;
        lead.UpdatedByUserId = updatedByUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: LEAD_UPDATED. TenantId={TenantId}, LeadId={LeadId}, UserId={UserId}",
            tenantId, lead.Id, updatedByUserId);

        var dto = new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        };

        return LeadOperationResult.Ok(dto);
    }

    public async Task<LeadOperationResult> DeleteLeadAsync(
        Guid tenantId,
        Guid leadId,
        Guid? deletedByUserId,
        CancellationToken cancellationToken = default)
    {
        var lead = await _dbContext.Leads
            .FirstOrDefaultAsync(l => l.Id == leadId && l.TenantId == tenantId, cancellationToken);

        if (lead == null)
        {
            _logger.LogWarning("AUDIT: LEAD_DELETE_NOT_FOUND_OR_DENIED. LeadId={LeadId}, TenantId={TenantId}", leadId, tenantId);
            return LeadOperationResult.Fail("NOT_FOUND", "Lead not found.");
        }

        _dbContext.Leads.Remove(lead);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: LEAD_DELETED. TenantId={TenantId}, LeadId={LeadId}, DeletedByUserId={DeletedByUserId}",
            tenantId, leadId, deletedByUserId);

        return LeadOperationResult.Ok(new LeadDto
        {
            Id = leadId,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        });
    }

    public async Task<LeadOperationResult> UpdateLeadStatusAsync(
        Guid tenantId,
        Guid leadId,
        string newStatus,
        Guid? updatedByUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newStatus) || !LeadStatus.IsValid(newStatus))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Invalid status value. Approved statuses are New, Contacted, Qualified, and Closed.");
        }

        var lead = await _dbContext.Leads
            .FirstOrDefaultAsync(l => l.Id == leadId && l.TenantId == tenantId, cancellationToken);

        if (lead == null)
        {
            _logger.LogWarning("AUDIT: LEAD_ACCESS_DENIED. LeadId={LeadId}, TenantId={TenantId}", leadId, tenantId);
            return LeadOperationResult.Fail("NOT_FOUND", "Lead not found.");
        }

        var oldStatus = lead.Status;
        lead.Status = newStatus.Trim();
        lead.UpdatedAt = DateTime.UtcNow;
        lead.UpdatedByUserId = updatedByUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: LEAD_STATUS_CHANGED. TenantId={TenantId}, LeadId={LeadId}, OldStatus={OldStatus}, NewStatus={NewStatus}, UpdatedByUserId={UpdatedByUserId}",
            tenantId, lead.Id, oldStatus, lead.Status, updatedByUserId);

        var dto = new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        };

        return LeadOperationResult.Ok(dto);
    }

    public async Task<LeadOperationResult> CreateWebsiteLeadAsync(
        Guid? tenantId,
        string? domain,
        PublicWebsiteLeadRequest request,
        CancellationToken cancellationToken = default)
    {
        // 1. Resolve Tenant safely
        Website? website = null;
        if (tenantId.HasValue)
        {
            website = await _dbContext.Websites
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.TenantId == tenantId.Value, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(domain))
        {
            var cleanDomain = domain.Trim().ToLowerInvariant().Split(':')[0];
            if (cleanDomain == "localhost" || cleanDomain == "127.0.0.1")
            {
                website = await _dbContext.Websites
                    .AsNoTracking()
                    .OrderByDescending(w => w.UpdatedAt)
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                website = await _dbContext.Websites
                    .AsNoTracking()
                    .FirstOrDefaultAsync(w => w.Domain == domain || w.Domain.ToLower() == cleanDomain || w.Domain.ToLower().Contains(cleanDomain), cancellationToken);

                if (website == null)
                {
                    var totalWebsites = await _dbContext.Websites.CountAsync(cancellationToken);
                    if (totalWebsites == 1)
                    {
                        website = await _dbContext.Websites.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
                    }
                }
            }
        }
        else
        {
            website = await _dbContext.Websites
                .AsNoTracking()
                .OrderByDescending(w => w.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (website == null)
        {
            return LeadOperationResult.Fail("TENANT_NOT_FOUND", "Could not resolve valid tenant for website enquiry.");
        }

        // 2. Validate input fields
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Customer name is required.");
        }
        if (name.Length > 256)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Customer name must not exceed 256 characters.");
        }

        var rawPhone = request.Phone?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawPhone))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Phone number is required.");
        }

        var normalizedPhone = PhoneNumberHelper.Normalize(rawPhone);
        if (normalizedPhone == null)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Invalid phone number format. Please provide a valid phone number.");
        }

        string? email = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var trimmedEmail = request.Email.Trim();
            if (trimmedEmail.Length > 256 || !trimmedEmail.Contains('@') || !trimmedEmail.Contains('.'))
            {
                return LeadOperationResult.Fail("VALIDATION_ERROR", "Please provide a valid email address.");
            }
            email = trimmedEmail.ToLowerInvariant();
        }

        var message = request.Message?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(message))
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Message is required.");
        }
        if (message.Length > 4000)
        {
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Message must not exceed 4000 characters.");
        }

        // If service/area of interest was specified, prepend to message
        if (!string.IsNullOrWhiteSpace(request.Service))
        {
            var servicePrefix = $"[Area of Interest: {request.Service.Trim()}]";
            message = $"{servicePrefix}\n{message}";
        }

        // 3. Controlled Server values
        var now = DateTime.UtcNow;
        var lead = new Lead
        {
            TenantId = website.TenantId,
            WebsiteId = website.Id,
            Name = name,
            Phone = normalizedPhone,
            Email = email,
            Message = message,
            Source = LeadSource.Website,
            Status = LeadStatus.New,
            SubmittedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Leads.Add(lead);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: LEAD_CREATED. TenantId={TenantId}, LeadId={LeadId}, Source={Source}, PhoneMasked={PhoneMasked}, SubmittedAt={SubmittedAt}",
            website.TenantId, lead.Id, lead.Source, PhoneNumberHelper.Mask(normalizedPhone), now);

        var dto = new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        };

        return LeadOperationResult.Ok(dto);
    }

    public async Task<LeadOperationResult> ProcessWhatsAppWebhookAsync(
        Guid tenantId,
        WhatsAppLeadWebhookRequest request,
        CancellationToken cancellationToken = default)
    {
        // 1. Verify tenant exists
        var tenantExists = await _dbContext.Tenants.AnyAsync(t => t.Id == tenantId, cancellationToken);
        if (!tenantExists)
        {
            _logger.LogWarning("AUDIT: LEAD_WEBHOOK_REJECTED. TenantId={TenantId}, Reason=TenantNotFound", tenantId);
            return LeadOperationResult.Fail("TENANT_NOT_FOUND", "Tenant not found.");
        }

        // 2. Validate essential data
        var name = request.CustomerName?.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            name = "WhatsApp Customer";
        }
        if (name.Length > 256)
        {
            name = name.Substring(0, 256);
        }

        var rawPhone = request.Phone?.Trim() ?? string.Empty;
        var normalizedPhone = PhoneNumberHelper.Normalize(rawPhone);
        if (normalizedPhone == null)
        {
            _logger.LogWarning("AUDIT: LEAD_WEBHOOK_REJECTED. TenantId={TenantId}, Reason=InvalidPhone", tenantId);
            return LeadOperationResult.Fail("VALIDATION_ERROR", "Valid customer phone number is required.");
        }

        // 3. Idempotency: check if identical external reference (message/conversation ID) was already processed
        var externalRef = !string.IsNullOrWhiteSpace(request.MessageId)
            ? request.MessageId.Trim()
            : (!string.IsNullOrWhiteSpace(request.ConversationId) ? request.ConversationId.Trim() : null);

        if (!string.IsNullOrWhiteSpace(externalRef))
        {
            var existingLead = await _dbContext.Leads
                .FirstOrDefaultAsync(l => l.TenantId == tenantId && l.SourceReference == externalRef, cancellationToken);

            if (existingLead != null)
            {
                _logger.LogInformation(
                    "AUDIT: LEAD_WEBHOOK_IDEMPOTENT_IGNORED. TenantId={TenantId}, LeadId={LeadId}, ExternalRef={ExternalRef}",
                    tenantId, existingLead.Id, externalRef);

                var existingDto = new LeadDto
                {
                    Id = existingLead.Id,
                    Name = existingLead.Name,
                    Phone = existingLead.Phone,
                    Email = existingLead.Email,
                    Message = existingLead.Message,
                    Source = existingLead.Source,
                    Status = existingLead.Status,
                    SourceReference = existingLead.SourceReference,
                    SubmittedAt = existingLead.SubmittedAt,
                    CreatedAt = existingLead.CreatedAt,
                    UpdatedAt = existingLead.UpdatedAt
                };
                return LeadOperationResult.Ok(existingDto);
            }
        }

        // 4. Create new WhatsApp lead
        var now = DateTime.UtcNow;
        var submittedTime = request.Timestamp.HasValue && request.Timestamp.Value <= now
            ? request.Timestamp.Value.ToUniversalTime()
            : now;

        var message = request.Message?.Trim() ?? "WhatsApp enquiry";
        if (message.Length > 4000)
        {
            message = message.Substring(0, 4000);
        }

        var lead = new Lead
        {
            TenantId = tenantId,
            Name = name,
            Phone = normalizedPhone,
            Message = message,
            Source = LeadSource.WhatsApp,
            Status = LeadStatus.New,
            SourceReference = externalRef,
            SubmittedAt = submittedTime,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Leads.Add(lead);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: LEAD_CREATED. TenantId={TenantId}, LeadId={LeadId}, Source={Source}, PhoneMasked={PhoneMasked}, SubmittedAt={SubmittedAt}, ExternalRef={ExternalRef}",
            tenantId, lead.Id, lead.Source, PhoneNumberHelper.Mask(normalizedPhone), submittedTime, externalRef);

        var dto = new LeadDto
        {
            Id = lead.Id,
            Name = lead.Name,
            Phone = lead.Phone,
            Email = lead.Email,
            Message = lead.Message,
            Source = lead.Source,
            Status = lead.Status,
            SourceReference = lead.SourceReference,
            SubmittedAt = lead.SubmittedAt,
            CreatedAt = lead.CreatedAt,
            UpdatedAt = lead.UpdatedAt
        };

        return LeadOperationResult.Ok(dto);
    }

    public async Task<int> GetNewLeadsCountAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Leads
            .AsNoTracking()
            .CountAsync(l => l.TenantId == tenantId && l.Status == LeadStatus.New, cancellationToken);
    }
}
