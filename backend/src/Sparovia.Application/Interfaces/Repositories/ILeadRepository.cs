using Sparovia.Domain.Entities;

namespace Sparovia.Application.Interfaces.Repositories;

public interface ILeadRepository
{
    Task<Lead?> GetByIdAsync(Guid id, Guid businessId, CancellationToken cancellationToken = default);
    Task<List<Lead>> GetByBusinessIdAsync(Guid businessId, CancellationToken cancellationToken = default);
    Task AddAsync(Lead lead, CancellationToken cancellationToken = default);
    void Update(Lead lead);
    void Delete(Lead lead);
}
