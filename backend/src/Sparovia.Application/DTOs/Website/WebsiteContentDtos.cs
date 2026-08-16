namespace Sparovia.Application.DTOs.Website;

public class WebsiteContentDto
{
    public Guid Id { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string SectionType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
}
