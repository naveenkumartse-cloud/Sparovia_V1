using Sparovia.Domain.Entities;

namespace Sparovia.Application.Interfaces.Repositories;

public interface IWebsiteContentRepository
{
    Task<WebsiteContent?> GetByIdAsync(Guid id, Guid businessId, CancellationToken cancellationToken = default);
    Task<List<WebsiteContent>> GetByBusinessIdAsync(Guid businessId, CancellationToken cancellationToken = default);
    Task AddAsync(WebsiteContent content, CancellationToken cancellationToken = default);
    void Update(WebsiteContent content);
    void Delete(WebsiteContent content);
}
