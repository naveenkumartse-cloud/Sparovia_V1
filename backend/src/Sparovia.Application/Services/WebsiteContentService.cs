using Sparovia.Application.DTOs.Website;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.Services;

public class WebsiteContentService
{
    private readonly IWebsiteContentRepository _websiteContentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public WebsiteContentService(IWebsiteContentRepository websiteContentRepository, IUnitOfWork unitOfWork)
    {
        _websiteContentRepository = websiteContentRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<WebsiteContentDto>> GetContentAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        var content = await _websiteContentRepository.GetByBusinessIdAsync(businessId, cancellationToken);
        
        // If empty (new business), seed default sections
        if (content.Count == 0)
        {
            content = await SeedDefaultContentAsync(businessId, cancellationToken);
        }

        return content.Select(MapToDto).OrderBy(c => c.SectionName).ToList();
    }

    private async Task<List<WebsiteContent>> SeedDefaultContentAsync(Guid businessId, CancellationToken cancellationToken)
    {
        var sections = new List<WebsiteContent>
        {
            WebsiteContent.Create(businessId, "Cinematic Hero Showcase", "Hero", "Active", 3),
            WebsiteContent.Create(businessId, "Brand & Philosophy Intro", "Brand", "Active", 1),
            WebsiteContent.Create(businessId, "Interior Storytelling (Kitchens, Wardrobes, Living)", "Categories", "Active", 5),
            WebsiteContent.Create(businessId, "uPVC Window Engineering", "Engineering", "Active", 4),
            WebsiteContent.Create(businessId, "Craftsmanship & Materials", "Craftsmanship", "Active", 3),
            WebsiteContent.Create(businessId, "Project Gallery & Portfolio", "Portfolio", "Active", 5),
            WebsiteContent.Create(businessId, "Client Testimonials & FAQs", "Social Proof", "Active", 8),
            WebsiteContent.Create(businessId, "Contact & Lead Capture Form", "Conversion", "Active", 1)
        };

        foreach (var sec in sections)
        {
            await _websiteContentRepository.AddAsync(sec, cancellationToken);
        }
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return sections;
    }

    private static WebsiteContentDto MapToDto(WebsiteContent content)
    {
        return new WebsiteContentDto
        {
            Id = content.Id,
            SectionName = content.SectionName,
            SectionType = content.SectionType,
            Status = content.Status,
            ItemsCount = content.ItemsCount
        };
    }
}
