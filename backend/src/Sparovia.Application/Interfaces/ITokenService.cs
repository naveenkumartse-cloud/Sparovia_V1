using Sparovia.Domain.Entities;

namespace Sparovia.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}
