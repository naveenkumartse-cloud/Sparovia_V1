using System.Text.Json;

namespace Sparovia.Application.WebsiteContent;

public class WebsiteDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public required string Domain { get; set; }
    public required string ConnectionStatus { get; set; }
    public string TemplateId { get; set; } = "kvn-interiors-v1";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ContentSectionSummaryDto
{
    public required string SectionKey { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Status { get; set; }
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool HasUnpublishedChanges { get; set; }
}

public class SubFieldSchemaDto
{
    public required string Key { get; set; }
    public required string Label { get; set; }
    public required string Type { get; set; } // "text", "textarea"
    public bool Required { get; set; } = false;
    public int? MaxLength { get; set; }
    public string? Tooltip { get; set; }
    public string? Placeholder { get; set; }
}

public class SectionFieldSchemaDto
{
    public required string Key { get; set; }
    public required string Label { get; set; }
    public required string Type { get; set; } // "text", "textarea", "list", "items"
    public bool Required { get; set; } = false;
    public int? MaxLength { get; set; }
    public string? Tooltip { get; set; }
    public string? Placeholder { get; set; }
    public List<SubFieldSchemaDto>? ItemFields { get; set; }
}

public class WebsiteSectionSchemaDto
{
    public required string SectionKey { get; set; }
    public required string DisplayName { get; set; }
    public required string Description { get; set; }
    public string IconName { get; set; } = "FileEdit";
    public List<SectionFieldSchemaDto> Fields { get; set; } = new();
}

public class ContentSectionDetailDto
{
    public required string SectionKey { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Status { get; set; }
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public required JsonElement DraftFields { get; set; }
    public JsonElement? PublishedFields { get; set; }
    public bool HasUnpublishedChanges { get; set; }
    public WebsiteSectionSchemaDto? Schema { get; set; }
}

public class SaveDraftRequest
{
    public required JsonElement Fields { get; set; }
}

public class PublishSectionRequest
{
    public int? Version { get; set; }
}

public class PublishedWebsiteContentDto
{
    public required WebsiteDto Website { get; set; }
    public required Dictionary<string, JsonElement> Sections { get; set; } = new();
}

public class WebsiteContentOperationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public ContentSectionDetailDto? Section { get; set; }
}

public class WebsiteContentOverviewDto
{
    public required WebsiteDto Website { get; set; }
    public required List<ContentSectionDetailDto> Sections { get; set; } = new();
}

