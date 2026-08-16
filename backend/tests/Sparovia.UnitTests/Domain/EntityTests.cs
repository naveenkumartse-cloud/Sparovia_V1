using FluentAssertions;
using Sparovia.Domain.Entities;
using Sparovia.Domain.Exceptions;
using Xunit;

namespace Sparovia.UnitTests.Domain;

public class BusinessDomainTests
{
    [Fact]
    public void Business_Create_ValidData_Succeeds()
    {
        var b = Business.Create("My Business", "my-business", "Retail");
        b.Name.Should().Be("My Business");
        b.Slug.Should().Be("my-business");
        b.IsActive.Should().BeTrue();
        b.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Business_Create_EmptyName_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => Business.Create("", "slug", "Retail"));
    }

    [Fact]
    public void Membership_CreateOwner_SetsCorrectRole()
    {
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();

        var m = Membership.CreateOwner(userId, businessId);

        m.Role.Should().Be(Sparovia.Domain.Enums.MembershipRole.Owner);
        m.Status.Should().Be(Sparovia.Domain.Enums.MembershipStatus.Active);
        m.UserId.Should().Be(userId);
        m.BusinessId.Should().Be(businessId);
    }

    [Fact]
    public void User_Create_EmailIsNormalized()
    {
        var user = User.Create("Test@EXAMPLE.COM", "hash", "Jane", "Doe");
        user.Email.Should().Be("test@example.com");
    }
}
