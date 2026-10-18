using Sparovia.Application.Leads;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;

namespace Sparovia.UnitTests;

public class LeadFollowUpValidationTests
{
    [Theory]
    [InlineData("Call", true)]
    [InlineData("WhatsApp", true)]
    [InlineData("Email", true)]
    [InlineData("Meeting", true)]
    [InlineData("Other", true)]
    [InlineData("call", true)]
    [InlineData("WHATSAPP", true)]
    [InlineData("email", true)]
    [InlineData("meeting", true)]
    [InlineData("other", true)]
    [InlineData("Telegram", false)]
    [InlineData("SMS", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void LeadFollowUpMethod_ValidatesApprovedMethodsOnly(string? method, bool expectedValid)
    {
        var isValid = LeadFollowUpMethod.IsValid(method);
        Assert.Equal(expectedValid, isValid);
    }

    [Theory]
    [InlineData("call", "Call")]
    [InlineData("WHATSAPP", "WhatsApp")]
    [InlineData(" Email ", "Email")]
    [InlineData("meeting", "Meeting")]
    [InlineData("OTHER", "Other")]
    public void LeadFollowUpMethod_NormalizesCasingCorrectly(string input, string expected)
    {
        var normalized = LeadFollowUpMethod.Normalize(input);
        Assert.Equal(expected, normalized);
    }

    [Fact]
    public void LeadFollowUpEntity_InitializesWithDefaultValues()
    {
        var followUp = new LeadFollowUp
        {
            TenantId = Guid.NewGuid(),
            LeadId = Guid.NewGuid(),
            Notes = "Client answered and requested follow up tomorrow."
        };

        Assert.NotEqual(Guid.Empty, followUp.Id);
        Assert.Equal("Call", followUp.Method);
        Assert.True(followUp.FollowedUpAt <= DateTime.UtcNow);
        Assert.True(followUp.CreatedAt <= DateTime.UtcNow);
        Assert.Null(followUp.NextAction);
        Assert.Null(followUp.NextFollowUpAt);
    }

    [Fact]
    public void CreateLeadFollowUpRequest_DefaultValues_AreSensible()
    {
        var request = new CreateLeadFollowUpRequest();

        Assert.Equal("Call", request.Method);
        Assert.Equal(string.Empty, request.Notes);
        Assert.Null(request.NextAction);
        Assert.Null(request.NextFollowUpAt);
    }
}
