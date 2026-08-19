using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence;

namespace Sparovia.Infrastructure.Repositories;

public class LeadRepository : ILeadRepository
{
    private readonly SparoviaDbContext _context;

    public LeadRepository(SparoviaDbContext context)
    {
        _context = context;
    }

    public async Task<Lead?> GetByIdAsync(Guid id, Guid businessId, CancellationToken cancellationToken = default)
    {
        return await _context.Leads
            .FirstOrDefaultAsync(l => l.Id == id && l.BusinessId == businessId, cancellationToken);
    }

    public async Task<List<Lead>> GetByBusinessIdAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return await _context.Leads
            .Where(l => l.BusinessId == businessId)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Lead lead, CancellationToken cancellationToken = default)
    {
        await _context.Leads.AddAsync(lead, cancellationToken);
    }

    public void Update(Lead lead)
    {
        _context.Leads.Update(lead);
    }

    public void Delete(Lead lead)
    {
        _context.Leads.Remove(lead);
    }
}
