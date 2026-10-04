using Sparovia.Application.Common;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;

namespace Sparovia.UnitTests;

public class LeadValidationTests
{
    [Theory]
    [InlineData("New", true)]
    [InlineData("Contacted", true)]
    [InlineData("Qualified", true)]
    [InlineData("Closed", true)]
    [InlineData("new", true)]
    [InlineData("CONTACTED", true)]
    [InlineData("qualified", true)]
    [InlineData("closed", true)]
    [InlineData("Negotiating", false)]
    [InlineData("Won", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void LeadStatus_ValidatesApprovedStatusesOnly(string? status, bool expectedValid)
    {
        var isValid = LeadStatus.IsValid(status);
        Assert.Equal(expectedValid, isValid);
    }

    [Theory]
    [InlineData("Website", true)]
    [InlineData("WhatsApp", true)]
    [InlineData("website", true)]
    [InlineData("whatsapp", true)]
    [InlineData("Facebook", false)]
    [InlineData("Instagram", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void LeadSource_ValidatesApprovedSourcesOnly(string? source, bool expectedValid)
    {
        var isValid = LeadSource.IsValid(source);
        Assert.Equal(expectedValid, isValid);
    }

    [Theory]
    [InlineData("9876543210", "+919876543210")]
    [InlineData("+919876543210", "+919876543210")]
    [InlineData("09876543210", "+919876543210")]
    [InlineData("+14155552671", "+14155552671")]
    public void PhoneNumberHelper_NormalizesCustomerPhonesCorrectly(string raw, string expected)
    {
        var normalized = PhoneNumberHelper.Normalize(raw);
        Assert.Equal(expected, normalized);
    }

    [Fact]
    public void LeadEntity_InitializesWithDefaultValues()
    {
        var lead = new Lead
        {
            Name = "Aarav Patel",
            Phone = "+919876543210",
            Message = "Need consultation for interior work"
        };

        Assert.NotEqual(Guid.Empty, lead.Id);
        Assert.Equal(LeadStatus.New, lead.Status);
        Assert.Equal(LeadSource.Website, lead.Source);
        Assert.True(lead.SubmittedAt <= DateTime.UtcNow);
        Assert.True(lead.CreatedAt <= DateTime.UtcNow);
    }
}
