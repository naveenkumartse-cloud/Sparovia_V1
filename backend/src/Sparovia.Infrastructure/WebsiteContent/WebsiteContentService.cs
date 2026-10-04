using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sparovia.Application.WebsiteContent;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.WebsiteContent;

public class WebsiteContentService : IWebsiteContentService
{
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<WebsiteContentService>? _logger;

    public WebsiteContentService(SparoviaDbContext dbContext, ILogger<WebsiteContentService>? logger = null)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<WebsiteDto> GetOrCreateConnectedWebsiteAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var website = await _dbContext.Websites
            .FirstOrDefaultAsync(w => w.TenantId == tenantId, cancellationToken);

        if (website == null)
        {
            var businessContext = await _dbContext.BusinessContexts
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

            var name = !string.IsNullOrWhiteSpace(businessContext?.BusinessName)
                ? businessContext.BusinessName
                : "Sparovia Website";

            var domain = !string.IsNullOrWhiteSpace(businessContext?.Website)
                ? businessContext.Website.Replace("https://", "").Replace("http://", "").TrimEnd('/')
                : "sparovia-site.local";

            website = new Website
            {
                TenantId = tenantId,
                Name = name,
                Domain = domain,
                ConnectionStatus = "Connected",
                TemplateId = WebsiteTemplateRegistry.DefaultTemplateId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Websites.Add(website);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Seed default supported sections for this template
            await SeedDefaultSectionsAsync(tenantId, website.Id, website.TemplateId, businessContext, cancellationToken);
        }
        else
        {
            var businessContext = await _dbContext.BusinessContexts
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

            if (businessContext != null)
            {
                var expectedName = !string.IsNullOrWhiteSpace(businessContext.BusinessName)
                    ? businessContext.BusinessName
                    : website.Name;

                var expectedDomain = !string.IsNullOrWhiteSpace(businessContext.Website)
                    ? businessContext.Website.Replace("https://", "").Replace("http://", "").TrimEnd('/')
                    : website.Domain;

                if (website.Name != expectedName || website.Domain != expectedDomain)
                {
                    website.Name = expectedName;
                    website.Domain = expectedDomain;
                    website.UpdatedAt = DateTime.UtcNow;
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
        }

        return new WebsiteDto
        {
            Id = website.Id,
            TenantId = website.TenantId,
            Name = website.Name,
            Domain = website.Domain,
            ConnectionStatus = website.ConnectionStatus,
            TemplateId = website.TemplateId,
            CreatedAt = website.CreatedAt,
            UpdatedAt = website.UpdatedAt
        };
    }

    private async Task SeedDefaultSectionsAsync(Guid tenantId, Guid websiteId, string? templateId, BusinessContext? context, CancellationToken cancellationToken)
    {
        var template = WebsiteTemplateRegistry.GetTemplate(templateId);
        var existingKeys = await _dbContext.WebsiteContents
            .Where(c => c.TenantId == tenantId && c.WebsiteId == websiteId)
            .Select(c => c.SectionKey)
            .ToListAsync(cancellationToken);

        foreach (var sec in template.Sections)
        {
            if (!existingKeys.Contains(sec.SectionKey))
            {
                var defaultJson = GetDefaultContentJson(sec.SectionKey, context);
                var content = new Domain.Entities.WebsiteContent
                {
                    TenantId = tenantId,
                    WebsiteId = websiteId,
                    SectionKey = sec.SectionKey,
                    DraftContentJson = defaultJson,
                    PublishedContentJson = defaultJson, // Initially synchronized with default approved template
                    Status = "Published",
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    PublishedAt = DateTime.UtcNow
                };
                _dbContext.WebsiteContents.Add(content);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string GetDefaultContentJson(string sectionKey, BusinessContext? context)
    {
        var businessName = context?.BusinessName ?? "KVN Interiors";
        var description = context?.BusinessDescription ?? "Crafting modern residential transformations through custom modular kitchens, luxury wardrobes, living units, and engineered uPVC window solutions.";
        var normalizedKey = WebsiteTemplateRegistry.NormalizeSectionKey(sectionKey);

        object contentObj = normalizedKey switch
        {
            "hero" => new
            {
                eyebrow = "HOME INTERIORS • uPVC WINDOWS",
                headline = "Transform Your Space.",
                subheadline = description,
                primaryCta = "Get a Quote",
                secondaryCta = "Explore Our Work"
            },
            "about" => new
            {
                badge = "Craftsmanship & Quality",
                title = $"Crafting Spaces That Reflect You at {businessName}",
                description = "We focus on delivering real residential projects with pristine craftsmanship, clean ergonomics, and reliable project execution.",
                pillars = new[]
                {
                    "Tailored Modular Kitchen & Wardrobe Layouts",
                    "Engineered uPVC Window & Door Systems",
                    "Precision Finish & Material Selection",
                    "Dedicated Project Supervision"
                }
            },
            "services" => new
            {
                eyebrow = "INTERIORS",
                heading = "Designed around the way you live.",
                description = "Every space we craft begins with how you move through it — your rituals, your comfort, your daily life.",
                categories = new[]
                {
                    new { id = "modular-kitchens", index = "01", name = "Modular Kitchens", tagline = "Designed for everyday living.", description = "Custom layouts, durable finishes, and ergonomic configurations tailored to your cooking and hosting needs." },
                    new { id = "wardrobes", index = "02", name = "Bespoke Wardrobes", tagline = "Organization meets elegance.", description = "Floor-to-ceiling wardrobe systems that maximize space while maintaining clean, contemporary lines." },
                    new { id = "living-units", index = "03", name = "Living / TV Units", tagline = "Where design meets daily comfort.", description = "Tailored media consoles and accent paneling that integrate technology seamlessly with your interior." }
                }
            },
            "why-choose-us" => new
            {
                eyebrow = "WHY CHOOSE US",
                heading = "Built on trust and real experience.",
                description = "We focus on clear communication, quality material selection, and dedicated execution on every project.",
                items = new[]
                {
                    new { index = "01", title = "Customized Design", description = "Every project is tailored specifically to your floorplan, lifestyle, and aesthetic preferences." },
                    new { index = "02", title = "Quality Materials", description = "We source proven materials, laminates, and hardware to ensure lasting performance." },
                    new { index = "03", title = "Professional Supervision", description = "Experienced team members oversee installation to maintain strict quality standards." },
                    new { index = "04", title = "Transparent Pricing", description = "Clear project scope, honest advice, and committed delivery schedules on every project." }
                }
            },
            "our-work" => new
            {
                eyebrow = "OUR WORK",
                heading = "Spaces brought to life.",
                description = "A curated portfolio of featured client projects and completed craftsmanship.",
                categories = new[] { "All" }
            },
            "testimonials" => new
            {
                eyebrow = "CLIENT FEEDBACK",
                heading = "Client Experiences",
                list = new[]
                {
                    new { quote = "The modular kitchen and uPVC window installation completely transformed our home.", author = "R. Sharma", location = "Residential Villa Owner" },
                    new { quote = "Our wardrobe system and living media wall look incredible. Clean execution throughout.", author = "A. Patel", location = "Apartment Homeowner" }
                }
            },
            "faq" => new
            {
                eyebrow = "FREQUENTLY ASKED QUESTIONS",
                heading = "Clear answers to common questions.",
                list = new[]
                {
                    new { question = $"What solutions does {businessName} provide?", answer = "We specialize in Home Interiors (Modular Kitchens, Wardrobes, Living/TV Units) and engineered uPVC Window and Door installations." },
                    new { question = "How do I request a project quote?", answer = "Click the \"Get a Quote\" or \"Contact Us\" buttons on the landing page, submit your basic project details, and our team will get in touch with you." },
                    new { question = "Can designs be customized for my floorplan?", answer = "Yes. Every interior module and window installation is custom-designed and fabricated to fit your exact measurements and design preferences." },
                    new { question = "Do you handle both interiors and uPVC windows for the same project?", answer = "Yes. We offer complete solution packages covering both interior woodwork and uPVC window/door installations." }
                }
            },
            "contact" => new
            {
                eyebrow = "GET IN TOUCH",
                heading = "Let's Discuss Your Project.",
                description = "Reach out to schedule an initial design consultation, explore material finishes, or discuss floorplan specifications.",
                ctaLabel = "Request Consultation"
            },
            "footer" => new
            {
                shortDescription = description,
                copyrightText = $"© {DateTime.UtcNow.Year} {businessName}. All rights reserved."
            },
            _ => new { }
        };

        return JsonSerializer.Serialize(contentObj, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true });
    }

    public async Task<WebsiteContentOverviewDto> GetOverviewAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var website = await GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        var template = WebsiteTemplateRegistry.GetTemplate(website.TemplateId);

        var contents = await _dbContext.WebsiteContents
            .Where(c => c.TenantId == tenantId && c.WebsiteId == website.Id)
            .ToListAsync(cancellationToken);

        // Normalize any legacy keys in DB to canonical keys
        bool hasChanges = false;
        foreach (var c in contents)
        {
            var normalized = WebsiteTemplateRegistry.NormalizeSectionKey(c.SectionKey);
            if (c.SectionKey != normalized)
            {
                if (!contents.Any(existing => existing.SectionKey == normalized))
                {
                    c.SectionKey = normalized;
                    hasChanges = true;
                }
            }
        }
        if (hasChanges)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        // Seed any missing sections defined by the template
        var existingKeys = contents.Select(c => c.SectionKey).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var businessContext = await _dbContext.BusinessContexts
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        foreach (var sec in template.Sections)
        {
            if (!existingKeys.Contains(sec.SectionKey))
            {
                var defaultJson = GetDefaultContentJson(sec.SectionKey, businessContext);
                var newContent = new Domain.Entities.WebsiteContent
                {
                    TenantId = tenantId,
                    WebsiteId = website.Id,
                    SectionKey = sec.SectionKey,
                    DraftContentJson = defaultJson,
                    PublishedContentJson = defaultJson,
                    Status = "Published",
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    PublishedAt = DateTime.UtcNow
                };
                _dbContext.WebsiteContents.Add(newContent);
                contents.Add(newContent);
                existingKeys.Add(sec.SectionKey);
                hasChanges = true;
            }
        }
        if (hasChanges)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var contentMap = contents.ToDictionary(c => c.SectionKey, c => c, StringComparer.OrdinalIgnoreCase);
        var sections = new List<ContentSectionDetailDto>();

        foreach (var sec in template.Sections)
        {
            if (contentMap.TryGetValue(sec.SectionKey, out var content))
            {
                using var draftDoc = JsonDocument.Parse(content.DraftContentJson);
                var draftElement = draftDoc.RootElement.Clone();

                JsonElement? publishedElement = null;
                if (!string.IsNullOrWhiteSpace(content.PublishedContentJson))
                {
                    using var pubDoc = JsonDocument.Parse(content.PublishedContentJson);
                    publishedElement = pubDoc.RootElement.Clone();
                }

                sections.Add(new ContentSectionDetailDto
                {
                    SectionKey = content.SectionKey,
                    Title = sec.DisplayName,
                    Description = sec.Description,
                    Status = content.Status,
                    Version = content.Version,
                    UpdatedAt = content.UpdatedAt,
                    PublishedAt = content.PublishedAt,
                    DraftFields = draftElement,
                    PublishedFields = publishedElement,
                    HasUnpublishedChanges = content.DraftContentJson != content.PublishedContentJson,
                    Schema = sec
                });
            }
        }

        return new WebsiteContentOverviewDto
        {
            Website = website,
            Sections = sections
        };
    }

    public async Task<List<ContentSectionSummaryDto>> GetSectionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var overview = await GetOverviewAsync(tenantId, cancellationToken);
        return overview.Sections.Select(s => new ContentSectionSummaryDto
        {
            SectionKey = s.SectionKey,
            Title = s.Title,
            Description = s.Description,
            Status = s.Status,
            Version = s.Version,
            UpdatedAt = s.UpdatedAt,
            PublishedAt = s.PublishedAt,
            HasUnpublishedChanges = s.HasUnpublishedChanges
        }).ToList();
    }

    public async Task<ContentSectionDetailDto?> GetSectionAsync(Guid tenantId, string sectionKey, CancellationToken cancellationToken = default)
    {
        var website = await GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        var normalizedKey = WebsiteTemplateRegistry.NormalizeSectionKey(sectionKey);
        var schema = WebsiteTemplateRegistry.GetSectionSchema(website.TemplateId, normalizedKey);

        if (schema == null)
        {
            return null;
        }

        var content = await _dbContext.WebsiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == website.Id && (c.SectionKey == normalizedKey || c.SectionKey == sectionKey), cancellationToken);

        if (content == null)
        {
            return null;
        }

        using var draftDoc = JsonDocument.Parse(content.DraftContentJson);
        var draftElement = draftDoc.RootElement.Clone();

        JsonElement? publishedElement = null;
        if (!string.IsNullOrWhiteSpace(content.PublishedContentJson))
        {
            using var pubDoc = JsonDocument.Parse(content.PublishedContentJson);
            publishedElement = pubDoc.RootElement.Clone();
        }

        return new ContentSectionDetailDto
        {
            SectionKey = content.SectionKey,
            Title = schema.DisplayName,
            Description = schema.Description,
            Status = content.Status,
            Version = content.Version,
            UpdatedAt = content.UpdatedAt,
            PublishedAt = content.PublishedAt,
            DraftFields = draftElement,
            PublishedFields = publishedElement,
            HasUnpublishedChanges = content.DraftContentJson != content.PublishedContentJson,
            Schema = schema
        };
    }

    public async Task<WebsiteContentOperationResult> SaveDraftAsync(Guid tenantId, string sectionKey, JsonElement fields, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var website = await GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        var normalizedKey = WebsiteTemplateRegistry.NormalizeSectionKey(sectionKey);
        var schema = WebsiteTemplateRegistry.GetSectionSchema(website.TemplateId, normalizedKey);

        if (schema == null)
        {
            return new WebsiteContentOperationResult
            {
                Success = false,
                ErrorCode = "UNSUPPORTED_SECTION",
                ErrorMessage = $"Section '{sectionKey}' is not supported by the connected website template."
            };
        }

        var validationError = WebsiteTemplateRegistry.ValidateSectionFields(website.TemplateId, normalizedKey, fields);
        if (validationError != null)
        {
            return new WebsiteContentOperationResult
            {
                Success = false,
                ErrorCode = "VALIDATION_FAILED",
                ErrorMessage = validationError
            };
        }

        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == website.Id && (c.SectionKey == normalizedKey || c.SectionKey == sectionKey), cancellationToken);

        var jsonString = JsonSerializer.Serialize(fields, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true });

        if (content == null)
        {
            content = new Domain.Entities.WebsiteContent
            {
                TenantId = tenantId,
                WebsiteId = website.Id,
                SectionKey = normalizedKey,
                DraftContentJson = jsonString,
                PublishedContentJson = null,
                Status = "Draft",
                Version = 1,
                CreatedByUserId = userId,
                UpdatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.WebsiteContents.Add(content);
        }
        else
        {
            content.SectionKey = normalizedKey;
            content.DraftContentJson = jsonString;
            content.Status = "Draft";
            content.Version += 1;
            content.UpdatedByUserId = userId;
            content.UpdatedAt = DateTime.UtcNow;
        }

        var websiteEntity = await _dbContext.Websites
            .FirstOrDefaultAsync(w => w.Id == website.Id, cancellationToken);
        if (websiteEntity != null)
        {
            websiteEntity.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        using var draftDoc = JsonDocument.Parse(content.DraftContentJson);
        JsonElement? publishedElement = null;
        if (!string.IsNullOrWhiteSpace(content.PublishedContentJson))
        {
            using var pubDoc = JsonDocument.Parse(content.PublishedContentJson);
            publishedElement = pubDoc.RootElement.Clone();
        }

        return new WebsiteContentOperationResult
        {
            Success = true,
            Section = new ContentSectionDetailDto
            {
                SectionKey = content.SectionKey,
                Title = schema.DisplayName,
                Description = schema.Description,
                Status = content.Status,
                Version = content.Version,
                UpdatedAt = content.UpdatedAt,
                PublishedAt = content.PublishedAt,
                DraftFields = draftDoc.RootElement.Clone(),
                PublishedFields = publishedElement,
                HasUnpublishedChanges = content.DraftContentJson != content.PublishedContentJson,
                Schema = schema
            }
        };
    }

    public async Task<WebsiteContentOperationResult> PublishSectionAsync(Guid tenantId, string sectionKey, int? expectedVersion = null, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var website = await GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        var normalizedKey = WebsiteTemplateRegistry.NormalizeSectionKey(sectionKey);
        var schema = WebsiteTemplateRegistry.GetSectionSchema(website.TemplateId, normalizedKey);

        if (schema == null)
        {
            return new WebsiteContentOperationResult
            {
                Success = false,
                ErrorCode = "UNSUPPORTED_SECTION",
                ErrorMessage = $"Section '{sectionKey}' is not supported by the connected website template."
            };
        }

        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == website.Id && (c.SectionKey == normalizedKey || c.SectionKey == sectionKey), cancellationToken);

        if (content == null)
        {
            return new WebsiteContentOperationResult
            {
                Success = false,
                ErrorCode = "SECTION_NOT_FOUND",
                ErrorMessage = $"Section '{sectionKey}' does not exist."
            };
        }

        if (expectedVersion.HasValue && content.Version != expectedVersion.Value)
        {
            _logger?.LogWarning(
                "AUDIT: Website section publish rejected due to version mismatch. TenantId={TenantId}, WebsiteId={WebsiteId}, SectionKey={SectionKey}, ExpectedVersion={ExpectedVersion}, CurrentVersion={CurrentVersion}",
                tenantId, website.Id, sectionKey, expectedVersion, content.Version
            );

            return new WebsiteContentOperationResult
            {
                Success = false,
                ErrorCode = "VERSION_MISMATCH",
                ErrorMessage = $"Section has been updated by another action (Expected v{expectedVersion}, Current v{content.Version}). Please refresh."
            };
        }

        // Validate draft content integrity before promoting to live website (atomic failure safety)
        using var draftDoc = JsonDocument.Parse(content.DraftContentJson);
        var validationError = WebsiteTemplateRegistry.ValidateSectionFields(website.TemplateId, normalizedKey, draftDoc.RootElement);
        if (validationError != null)
        {
            _logger?.LogWarning(
                "AUDIT: Website section publish rejected due to schema/content validation error. TenantId={TenantId}, WebsiteId={WebsiteId}, SectionKey={SectionKey}, Error={Error}",
                tenantId, website.Id, sectionKey, validationError
            );

            return new WebsiteContentOperationResult
            {
                Success = false,
                ErrorCode = "VALIDATION_FAILED",
                ErrorMessage = $"Draft content is invalid and cannot be published: {validationError}"
            };
        }

        content.SectionKey = normalizedKey;
        content.PublishedContentJson = content.DraftContentJson;
        content.Status = "Published";
        content.PublishedAt = DateTime.UtcNow;
        content.UpdatedAt = DateTime.UtcNow;
        content.UpdatedByUserId = userId;

        var websiteEntity = await _dbContext.Websites
            .FirstOrDefaultAsync(w => w.Id == website.Id, cancellationToken);
        if (websiteEntity != null)
        {
            websiteEntity.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger?.LogInformation(
            "AUDIT: Website section published successfully. TenantId={TenantId}, WebsiteId={WebsiteId}, SectionKey={SectionKey}, Version={Version}, UserId={UserId}, PublishedAt={PublishedAt}",
            tenantId, website.Id, content.SectionKey, content.Version, userId, content.PublishedAt
        );

        using var pubDoc = JsonDocument.Parse(content.PublishedContentJson);

        return new WebsiteContentOperationResult
        {
            Success = true,
            Section = new ContentSectionDetailDto
            {
                SectionKey = content.SectionKey,
                Title = schema.DisplayName,
                Description = schema.Description,
                Status = content.Status,
                Version = content.Version,
                UpdatedAt = content.UpdatedAt,
                PublishedAt = content.PublishedAt,
                DraftFields = draftDoc.RootElement.Clone(),
                PublishedFields = pubDoc.RootElement.Clone(),
                HasUnpublishedChanges = false,
                Schema = schema
            }
        };
    }

    public async Task<PublishedWebsiteContentDto?> GetPublishedContentAsync(Guid? tenantId = null, string? domain = null, CancellationToken cancellationToken = default)
    {
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
                // In local development or test environments, resolve to the most recently active/updated website
                website = await _dbContext.Websites
                    .AsNoTracking()
                    .OrderByDescending(w => w.UpdatedAt)
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                website = await _dbContext.Websites
                    .AsNoTracking()
                    .FirstOrDefaultAsync(w => w.Domain == domain || w.Domain.ToLower() == cleanDomain || w.Domain.ToLower().Contains(cleanDomain) || cleanDomain.Contains(w.Domain.ToLower()), cancellationToken);

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
            return null;
        }

        var contents = await _dbContext.WebsiteContents
            .AsNoTracking()
            .Where(c => c.WebsiteId == website.Id && c.PublishedContentJson != null)
            .ToListAsync(cancellationToken);

        var sectionsMap = new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in contents)
        {
            if (!string.IsNullOrWhiteSpace(c.PublishedContentJson))
            {
                using var doc = JsonDocument.Parse(c.PublishedContentJson);
                sectionsMap[c.SectionKey] = doc.RootElement.Clone();

                // Populate legacy aliases for seamless backward compatibility
                if (c.SectionKey.Equals("about", StringComparison.OrdinalIgnoreCase))
                    sectionsMap["brandIntro"] = doc.RootElement.Clone();
                else if (c.SectionKey.Equals("services", StringComparison.OrdinalIgnoreCase))
                    sectionsMap["interiors"] = doc.RootElement.Clone();
                else if (c.SectionKey.Equals("why-choose-us", StringComparison.OrdinalIgnoreCase))
                    sectionsMap["whyUs"] = doc.RootElement.Clone();
                else if (c.SectionKey.Equals("our-work", StringComparison.OrdinalIgnoreCase))
                    sectionsMap["gallery"] = doc.RootElement.Clone();
                else if (c.SectionKey.Equals("faq", StringComparison.OrdinalIgnoreCase))
                    sectionsMap["faqs"] = doc.RootElement.Clone();
            }
        }

        // Enrich hero, about, and services sections with published active Website Images
        var publishedWebsiteImages = await _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => i.WebsiteId == website.Id && i.UsageType == "WebsiteImage" && i.Status == "Published" && i.IsActiveWebsiteUsage)
            .OrderByDescending(i => i.UpdatedAt)
            .ToListAsync(cancellationToken);

        foreach (var img in publishedWebsiteImages)
        {
            var publishedVariant = img.Variants
                .Where(v => v.Status == "Published")
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefault();

            var deliveryUrl = publishedVariant != null
                ? $"/api/v1/website/images/{img.Id}/variants/{publishedVariant.Id}/file"
                : $"/api/v1/website/images/{img.Id}/file";

            try
            {
                if (string.Equals(img.Slot, "heroImage", StringComparison.OrdinalIgnoreCase) || string.Equals(img.Slot, "hero", StringComparison.OrdinalIgnoreCase))
                {
                    JsonObject heroObj;
                    if (sectionsMap.TryGetValue("hero", out var existingHero))
                    {
                        heroObj = JsonNode.Parse(existingHero.GetRawText()) as JsonObject ?? new JsonObject();
                    }
                    else
                    {
                        heroObj = new JsonObject();
                    }
                    heroObj["heroImage"] = deliveryUrl;
                    heroObj["image"] = deliveryUrl;
                    var doc = JsonDocument.Parse(heroObj.ToJsonString());
                    sectionsMap["hero"] = doc.RootElement.Clone();
                }
                else if (string.Equals(img.Slot, "primaryImage", StringComparison.OrdinalIgnoreCase) || string.Equals(img.Slot, "aboutPrimary", StringComparison.OrdinalIgnoreCase) || string.Equals(img.Slot, "about", StringComparison.OrdinalIgnoreCase))
                {
                    JsonObject aboutObj;
                    if (sectionsMap.TryGetValue("about", out var existingAbout))
                    {
                        aboutObj = JsonNode.Parse(existingAbout.GetRawText()) as JsonObject ?? new JsonObject();
                    }
                    else
                    {
                        aboutObj = new JsonObject();
                    }
                    aboutObj["primaryImage"] = deliveryUrl;
                    aboutObj["image"] = deliveryUrl;
                    var doc = JsonDocument.Parse(aboutObj.ToJsonString());
                    sectionsMap["about"] = doc.RootElement.Clone();
                    sectionsMap["brandIntro"] = sectionsMap["about"];
                }
                else if (string.Equals(img.Slot, "secondaryImage", StringComparison.OrdinalIgnoreCase) || string.Equals(img.Slot, "aboutSecondary", StringComparison.OrdinalIgnoreCase))
                {
                    JsonObject aboutObj;
                    if (sectionsMap.TryGetValue("about", out var existingAbout))
                    {
                        aboutObj = JsonNode.Parse(existingAbout.GetRawText()) as JsonObject ?? new JsonObject();
                    }
                    else
                    {
                        aboutObj = new JsonObject();
                    }
                    aboutObj["secondaryImage"] = deliveryUrl;
                    var doc = JsonDocument.Parse(aboutObj.ToJsonString());
                    sectionsMap["about"] = doc.RootElement.Clone();
                    sectionsMap["brandIntro"] = sectionsMap["about"];
                }
                else if (string.Equals(img.Slot, "serviceImage", StringComparison.OrdinalIgnoreCase) || string.Equals(img.Slot, "services", StringComparison.OrdinalIgnoreCase))
                {
                    JsonObject servicesObj;
                    if (sectionsMap.TryGetValue("services", out var existingServices))
                    {
                        servicesObj = JsonNode.Parse(existingServices.GetRawText()) as JsonObject ?? new JsonObject();
                    }
                    else
                    {
                        servicesObj = new JsonObject();
                    }
                    servicesObj["image"] = deliveryUrl;
                    var doc = JsonDocument.Parse(servicesObj.ToJsonString());
                    sectionsMap["services"] = doc.RootElement.Clone();
                    sectionsMap["interiors"] = sectionsMap["services"];
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Failed to dynamically populate published Website Image for slot {Slot}", img.Slot);
            }
        }

        // Enrich our-work and gallery sections with published active ExploreOurWork images and tenant categories
        var publishedExploreImages = await _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => i.WebsiteId == website.Id && i.UsageType == "ExploreOurWork" && i.Status == "Published" && i.IsActiveWebsiteUsage)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        var activeWorkCategories = await _dbContext.WebsiteWorkCategories
            .AsNoTracking()
            .Where(c => (c.WebsiteId == website.Id || c.WebsiteId == Guid.Empty) && c.TenantId == website.TenantId && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => c.Name)
            .ToListAsync(cancellationToken);

        var dynamicCategories = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "All" };
        foreach (var c in activeWorkCategories) dynamicCategories.Add(c);
        foreach (var img in publishedExploreImages.Where(i => !string.IsNullOrWhiteSpace(i.Category)))
        {
            dynamicCategories.Add(img.Category!);
        }

        if (publishedExploreImages.Count > 0 || activeWorkCategories.Count > 0)
        {
            var targetKey = sectionsMap.ContainsKey("our-work") ? "our-work" : (sectionsMap.ContainsKey("gallery") ? "gallery" : "our-work");
            try
            {
                JsonObject ourWorkObj;
                if (sectionsMap.TryGetValue(targetKey, out var existingSection))
                {
                    var rootNode = JsonNode.Parse(existingSection.GetRawText());
                    ourWorkObj = rootNode as JsonObject ?? new JsonObject();
                }
                else
                {
                    ourWorkObj = new JsonObject
                    {
                        ["title"] = "Explore Our Work",
                        ["subtitle"] = "Featured Portfolio Projects"
                    };
                }

                ourWorkObj["categories"] = JsonSerializer.SerializeToNode(dynamicCategories.ToList());

                var itemsList = publishedExploreImages.Select((img, idx) =>
                {
                    var publishedVariant = img.Variants
                        .Where(v => v.Status == "Published")
                        .OrderByDescending(v => v.CreatedAt)
                        .FirstOrDefault();

                    var deliveryUrl = publishedVariant != null
                        ? $"/api/v1/website/images/{img.Id}/variants/{publishedVariant.Id}/file"
                        : $"/api/v1/website/images/{img.Id}/file";

                    return new
                    {
                        id = img.Id.ToString(),
                        title = !string.IsNullOrWhiteSpace(img.ProjectWorkName) ? img.ProjectWorkName : "Project Showcase",
                        image = deliveryUrl,
                        category = !string.IsNullOrWhiteSpace(img.Category) ? img.Category : "All",
                        span = idx == 0 ? "large" : "standard",
                        caption = img.Caption ?? ""
                    };
                }).ToList();

                ourWorkObj["items"] = JsonSerializer.SerializeToNode(itemsList);
                var updatedDoc = JsonDocument.Parse(ourWorkObj.ToJsonString());
                sectionsMap["our-work"] = updatedDoc.RootElement.Clone();
                sectionsMap["gallery"] = sectionsMap["our-work"];
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Failed to dynamically populate published Explore Our Work items in our-work section.");
            }
        }

        var tenantOnlyCategories = dynamicCategories.Where(c => !c.Equals("All", StringComparison.OrdinalIgnoreCase)).ToList();
        sectionsMap["tenantCategories"] = JsonDocument.Parse(JsonSerializer.Serialize(tenantOnlyCategories)).RootElement.Clone();

        return new PublishedWebsiteContentDto
        {
            Website = new WebsiteDto
            {
                Id = website.Id,
                TenantId = website.TenantId,
                Name = website.Name,
                Domain = website.Domain,
                ConnectionStatus = website.ConnectionStatus,
                TemplateId = website.TemplateId,
                CreatedAt = website.CreatedAt,
                UpdatedAt = website.UpdatedAt
            },
            Sections = sectionsMap
        };
    }
}
