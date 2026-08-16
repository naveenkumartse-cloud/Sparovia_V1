using Sparovia.Application.DTOs.Media;
using Sparovia.Application.Exceptions;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.Services;

public class MediaService
{
    private readonly IMediaRepository _mediaRepository;
    private readonly IStorageService _storageService;
    private readonly IUnitOfWork _unitOfWork;

    public MediaService(IMediaRepository mediaRepository, IStorageService storageService, IUnitOfWork unitOfWork)
    {
        _mediaRepository = mediaRepository;
        _storageService = storageService;
        _unitOfWork = unitOfWork;
    }

    public async Task<MediaAssetDto> UploadMediaAsync(Guid businessId, UploadMediaRequest request, CancellationToken cancellationToken = default)
    {
        var url = await _storageService.UploadFileAsync(request.FileStream, request.FileName, businessId.ToString(), cancellationToken);
        var title = Path.GetFileNameWithoutExtension(request.FileName);

        var media = MediaAsset.Create(
            businessId,
            title,
            request.Category,
            url
        );

        await _mediaRepository.AddAsync(media, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(media);
    }

    public async Task<List<MediaAssetDto>> GetMediaAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        var mediaList = await _mediaRepository.GetByBusinessIdAsync(businessId, cancellationToken);
        return mediaList.Select(MapToDto).OrderByDescending(m => m.UploadedAt).ToList();
    }

    private static MediaAssetDto MapToDto(MediaAsset media)
    {
        return new MediaAssetDto
        {
            Id = media.Id,
            Title = media.Title,
            Category = media.Category,
            Url = media.Url,
            UploadedAt = media.UploadedAt
        };
    }
}
