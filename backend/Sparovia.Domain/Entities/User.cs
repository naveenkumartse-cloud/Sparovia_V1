using Sparovia.Domain.Common;

namespace Sparovia.Domain.Entities;

public class User : BaseEntity
{
    public required string IdentityId { get; set; } // The ID from Supabase Auth
    public required string Email { get; set; }
    public required string FullName { get; set; }
}
