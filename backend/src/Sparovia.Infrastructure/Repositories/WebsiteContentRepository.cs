using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence;

namespace Sparovia.Infrastructure.Repositories;

public class WebsiteContentRepository : IWebsiteContentRepository
{
    private readonly SparoviaDbContext _context;

    public WebsiteContentRepository(SparoviaDbContext context)
    {
        _context = context;
    }

    public async Task<WebsiteContent?> GetByIdAsync(Guid id, Guid businessId, CancellationToken cancellationToken = default)
    {
        return await _context.WebsiteContents
            .FirstOrDefaultAsync(c => c.Id == id && c.BusinessId == businessId, cancellationToken);
    }

    public async Task<List<WebsiteContent>> GetByBusinessIdAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return await _context.WebsiteContents
            .Where(c => c.BusinessId == businessId)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(WebsiteContent content, CancellationToken cancellationToken = default)
    {
        await _context.WebsiteContents.AddAsync(content, cancellationToken);
    }

    public void Update(WebsiteContent content)
    {
        _context.WebsiteContents.Update(content);
    }

    public void Delete(WebsiteContent content)
    {
        _context.WebsiteContents.Remove(content);
    }
}
