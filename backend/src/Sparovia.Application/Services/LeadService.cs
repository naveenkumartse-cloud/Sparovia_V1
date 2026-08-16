using Sparovia.Application.DTOs.Leads;
using Sparovia.Application.Exceptions;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.Services;

public class LeadService
{
    private readonly ILeadRepository _leadRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LeadService(ILeadRepository leadRepository, IUnitOfWork unitOfWork)
    {
        _leadRepository = leadRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<LeadDto> CreateLeadAsync(Guid businessId, CreateLeadRequest request, CancellationToken cancellationToken = default)
    {
        var lead = Lead.Create(
            businessId,
            request.FullName,
            request.Email,
            request.Phone,
            request.Source,
            request.Notes
        );

        await _leadRepository.AddAsync(lead, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(lead);
    }

    public async Task<List<LeadDto>> GetLeadsAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        var leads = await _leadRepository.GetByBusinessIdAsync(businessId, cancellationToken);
        return leads.Select(MapToDto).OrderByDescending(l => l.CreatedAt).ToList();
    }

    public async Task<LeadDto> UpdateLeadStatusAsync(Guid id, Guid businessId, UpdateLeadStatusRequest request, CancellationToken cancellationToken = default)
    {
        var lead = await _leadRepository.GetByIdAsync(id, businessId, cancellationToken);
        if (lead == null) throw new NotFoundException("Lead not found.");

        lead.UpdateStatus(request.Status);
        
        _leadRepository.Update(lead);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(lead);
    }

    private static LeadDto MapToDto(Lead lead)
    {
        return new LeadDto
        {
            Id = lead.Id,
            FullName = lead.FullName,
            Email = lead.Email,
            Phone = lead.Phone,
            Source = lead.Source,
            Status = lead.Status,
            Notes = lead.Notes,
            CreatedAt = lead.CreatedAt
        };
    }
}
