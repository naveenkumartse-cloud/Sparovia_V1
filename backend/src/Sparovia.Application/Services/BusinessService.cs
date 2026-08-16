using Microsoft.Extensions.Logging;
using Sparovia.Application.DTOs.Business;
using Sparovia.Application.Exceptions;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.Services;

public class BusinessService
{
    private readonly IBusinessRepository _businessRepository;
    private readonly IMembershipRepository _membershipRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<BusinessService> _logger;

    public BusinessService(
        IBusinessRepository businessRepository,
        IMembershipRepository membershipRepository,
        IUnitOfWork unitOfWork,
        ILogger<BusinessService> logger)
    {
        _businessRepository = businessRepository;
        _membershipRepository = membershipRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<BusinessResponse> CreateBusinessAsync(
        Guid userId,
        CreateBusinessRequest request,
        CancellationToken cancellationToken = default)
    {
        var slugExists = await _businessRepository.ExistsBySlugAsync(request.Slug, cancellationToken);
        if (slugExists)
            throw new ConflictException($"The slug '{request.Slug}' is already taken.");

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var business = Business.Create(request.Name, request.Slug, request.Industry, request.Description);
            await _businessRepository.AddAsync(business, cancellationToken);

            var membership = Membership.CreateOwner(userId, business.Id);
            await _membershipRepository.AddAsync(membership, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            _logger.LogInformation(
                "Business created. BusinessId={BusinessId}, OwnerId={UserId}",
                business.Id, userId);

            return MapToResponse(business);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyList<BusinessResponse>> GetMyBusinessesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var businesses = await _businessRepository.GetByUserIdAsync(userId, cancellationToken);
        return businesses.Select(MapToResponse).ToList();
    }

    public async Task<BusinessResponse> GetBusinessAsync(
        Guid userId,
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        // Tenant isolation: always verify access through Membership
        var hasAccess = await _membershipRepository.UserHasAccessToBusinessAsync(userId, businessId, cancellationToken);
        if (!hasAccess)
            throw new ForbiddenException("You do not have access to this business.");

        var business = await _businessRepository.GetByIdAsync(businessId, cancellationToken);
        if (business is null)
            throw new NotFoundException("Business not found.");

        return MapToResponse(business);
    }

    private static BusinessResponse MapToResponse(Business b) =>
        new(b.Id, b.Name, b.Slug, b.Industry, b.Description, b.IsActive, b.CreatedAt);
}
