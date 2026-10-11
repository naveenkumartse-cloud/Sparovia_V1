using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sparovia.Application.ContactActivity;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.ContactActivity;

public class ContactActivityService : IContactActivityService
{
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<ContactActivityService> _logger;

    private static readonly HashSet<string> ApprovedChannels = new(StringComparer.OrdinalIgnoreCase)
    {
        "WhatsApp",
        "Facebook",
        "Instagram"
    };

    public ContactActivityService(SparoviaDbContext dbContext, ILogger<ContactActivityService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<ContactActivityOperationResult> RecordContactActivityAsync(
        Guid? tenantId,
        string? domain,
        RecordContactActivityRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return ContactActivityOperationResult.Fail("INVALID_PAYLOAD", "Activity payload cannot be null.");
        }

        // 1. Channel validation
        var rawChannel = request.Channel?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawChannel) || !ApprovedChannels.Contains(rawChannel))
        {
            return ContactActivityOperationResult.Fail("INVALID_CHANNEL", "Channel must be 'WhatsApp', 'Facebook', or 'Instagram'.");
        }

        var normalizedChannel = rawChannel.ToLowerInvariant() switch
        {
            "whatsapp" => "WhatsApp",
            "facebook" => "Facebook",
            "instagram" => "Instagram",
            _ => rawChannel
        };

        // 2. Resolve Tenant safely through trusted context or website domain resolution
        Website? website = null;
        if (tenantId.HasValue && tenantId.Value != Guid.Empty)
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
                    .Where(w => w.Domain == domain || w.Domain.ToLower() == cleanDomain || w.Domain.ToLower().Contains(cleanDomain) || cleanDomain.Contains(w.Domain.ToLower()))
                    .OrderByDescending(w => w.UpdatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                if (website == null)
                {
                    if (cleanDomain.EndsWith(".vercel.app") || cleanDomain.EndsWith(".onrender.com") || cleanDomain.Contains("sparovia") || cleanDomain.Contains("publicsite"))
                    {
                        website = await _dbContext.Websites
                            .AsNoTracking()
                            .Where(w => w.ConnectionStatus == "Connected")
                            .OrderByDescending(w => w.UpdatedAt)
                            .FirstOrDefaultAsync(cancellationToken);
                    }

                    if (website == null)
                    {
                        var totalWebsites = await _dbContext.Websites.CountAsync(cancellationToken);
                        if (totalWebsites >= 1)
                        {
                            website = await _dbContext.Websites.AsNoTracking().OrderByDescending(w => w.UpdatedAt).FirstOrDefaultAsync(cancellationToken);
                        }
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
            return ContactActivityOperationResult.Fail("TENANT_NOT_FOUND", "Could not resolve valid business for contact link tracking.");
        }

        var resolvedTenantId = website.TenantId;

        // 3. Best-effort correlation / deduplication (avoid rapid duplicate clicks from double clicking)
        var correlationId = request.CorrelationId?.Trim();
        if (!string.IsNullOrWhiteSpace(correlationId) && correlationId.Length <= 100)
        {
            var recentThreshold = DateTime.UtcNow.AddSeconds(-5);
            var existing = await _dbContext.ContactActivities
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.TenantId == resolvedTenantId && a.CorrelationId == correlationId && a.CreatedAt >= recentThreshold, cancellationToken);

            if (existing != null)
            {
                _logger.LogInformation(
                    "AUDIT: CONTACT_LINK_CLICKED_DUPLICATE_IGNORED. TenantId={TenantId}, Channel={Channel}, CorrelationId={CorrelationId}",
                    resolvedTenantId, normalizedChannel, correlationId);
                return ContactActivityOperationResult.Ok(existing.Id);
            }
        }

        // 4. Sanitize and prepare event fields
        var eventType = string.IsNullOrWhiteSpace(request.EventType) ? "ContactLinkClicked" : request.EventType.Trim();
        if (eventType.Length > 50) eventType = eventType.Substring(0, 50);

        string? templateId = null;
        if (!string.IsNullOrWhiteSpace(request.TemplateId))
        {
            templateId = request.TemplateId.Trim();
            if (templateId.Length > 50) templateId = templateId.Substring(0, 50);
        }

        string? templateTitle = null;
        if (!string.IsNullOrWhiteSpace(request.TemplateTitle))
        {
            templateTitle = request.TemplateTitle.Trim();
            if (templateTitle.Length > 100) templateTitle = templateTitle.Substring(0, 100);
        }

        string? source = null;
        if (!string.IsNullOrWhiteSpace(request.Source))
        {
            source = request.Source.Trim();
            if (source.Length > 50) source = source.Substring(0, 50);
        }

        var activity = new Domain.Entities.ContactActivity
        {
            TenantId = resolvedTenantId,
            WebsiteId = website.Id,
            Channel = normalizedChannel,
            EventType = eventType,
            TemplateId = templateId,
            TemplateTitle = templateTitle,
            Source = source,
            CorrelationId = string.IsNullOrWhiteSpace(correlationId) ? null : (correlationId.Length > 100 ? correlationId.Substring(0, 100) : correlationId),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ContactActivities.Add(activity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: CONTACT_LINK_CLICKED. TenantId={TenantId}, Channel={Channel}, TemplateId={TemplateId}, EventId={EventId}, Source={Source}",
            resolvedTenantId, normalizedChannel, templateId, activity.Id, source);

        return ContactActivityOperationResult.Ok(activity.Id);
    }

    public async Task<ContactActivitySummaryDto> GetActivitySummaryAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var baseQuery = _dbContext.ContactActivities
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId);

        var totalClicks = await baseQuery.CountAsync(cancellationToken);
        var whatsAppClicks = await baseQuery.CountAsync(a => a.Channel == "WhatsApp", cancellationToken);
        var facebookClicks = await baseQuery.CountAsync(a => a.Channel == "Facebook", cancellationToken);
        var instagramClicks = await baseQuery.CountAsync(a => a.Channel == "Instagram", cancellationToken);

        var recentActivities = await baseQuery
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new ContactActivityDto
            {
                Id = a.Id,
                Channel = a.Channel,
                EventType = a.EventType,
                TemplateId = a.TemplateId,
                TemplateTitle = a.TemplateTitle,
                Source = a.Source,
                CorrelationId = a.CorrelationId,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new ContactActivitySummaryDto
        {
            TotalClicks = totalClicks,
            WhatsAppClicks = whatsAppClicks,
            FacebookClicks = facebookClicks,
            InstagramClicks = instagramClicks,
            RecentActivities = recentActivities
        };
    }

    public async Task<ContactActivityListResponse> GetActivitiesAsync(
        Guid tenantId,
        ContactActivityQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var q = _dbContext.ContactActivities
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(query.Channel) && !string.Equals(query.Channel, "All", StringComparison.OrdinalIgnoreCase))
        {
            var filterChannel = query.Channel.Trim();
            q = q.Where(a => a.Channel.ToLower() == filterChannel.ToLower());
        }

        var totalCount = await q.CountAsync(cancellationToken);

        q = string.Equals(query.Sort, "oldest", StringComparison.OrdinalIgnoreCase)
            ? q.OrderBy(a => a.CreatedAt)
            : q.OrderByDescending(a => a.CreatedAt);

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ContactActivityDto
            {
                Id = a.Id,
                Channel = a.Channel,
                EventType = a.EventType,
                TemplateId = a.TemplateId,
                TemplateTitle = a.TemplateTitle,
                Source = a.Source,
                CorrelationId = a.CorrelationId,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new ContactActivityListResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
