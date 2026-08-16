using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Persistence;

namespace Sparovia.Infrastructure.Repositories;

public class MediaRepository : IMediaRepository
{
    private readonly SparoviaDbContext _context;

    public MediaRepository(SparoviaDbContext context)
    {
        _context = context;
    }

    public async Task<MediaAsset?> GetByIdAsync(Guid id, Guid businessId, CancellationToken cancellationToken = default)
    {
        return await _context.MediaAssets
            .FirstOrDefaultAsync(m => m.Id == id && m.BusinessId == businessId, cancellationToken);
    }

    public async Task<List<MediaAsset>> GetByBusinessIdAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        return await _context.MediaAssets
            .Where(m => m.BusinessId == businessId)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(MediaAsset media, CancellationToken cancellationToken = default)
    {
        await _context.MediaAssets.AddAsync(media, cancellationToken);
    }

    public void Delete(MediaAsset media)
    {
        _context.MediaAssets.Remove(media);
    }
}
