using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;

namespace Sparovia.IntegrationTests;

public class CompleteE2EFlowTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public CompleteE2EFlowTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CompleteUserJourney_FromRegistrationToDashboard_Succeeds()
    {
        // Setup capturing email service to intercept token
        var capturingEmailService = new CapturingEmailService();
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IEmailService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddSingleton<IEmailService>(capturingEmailService);
            });
        });

        var client = customFactory.CreateClient();
        var email = $"e2e-pilot-{Guid.NewGuid()}@sparovia.com";
        var password = "StrongPassword123!";

        // 1. REGISTER
        var regResponse = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Apex Director",
            Email = email,
            Password = password,
            ConfirmPassword = password,
            AcceptedTerms = true
        });
        Assert.Equal(HttpStatusCode.OK, regResponse.StatusCode);

        // Verify that verification link targets AdminUrl (http://localhost:3001) and NEVER /landing/*
        Assert.NotNull(capturingEmailService.LastVerificationLink);
        var link = capturingEmailService.LastVerificationLink;
        Assert.StartsWith("http://localhost:3001/verify-email", link);
        Assert.DoesNotContain("/landing/", link);
        Assert.DoesNotContain("localhost:3000", link);

        // Extract token from link
        var uri = new Uri(link);
        var queryParams = System.Web.HttpUtility.ParseQueryString(uri.Query);
        var token = queryParams["token"];
        Assert.NotNull(token);

        // 2. ATTEMPT SIGN IN BEFORE VERIFICATION -> Should fail
        var unverifiedLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new SignInRequest
        {
            Email = email,
            Password = password
        });
        Assert.Equal(HttpStatusCode.BadRequest, unverifiedLogin.StatusCode);

        // 3. VERIFY EMAIL
        var verifyResponse = await client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequest
        {
            Email = email,
            Token = token
        });
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);

        // 4. SIGN IN AS VERIFIED USER
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new SignInRequest
        {
            Email = email,
            Password = password
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.True(loginResponse.Headers.Contains("Set-Cookie"));

        // 5. GET /auth/me
        var meResponse = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var meData = await meResponse.Content.ReadFromJsonAsync<CurrentUserDto>();
        Assert.NotNull(meData);
        Assert.Equal(email, meData.Email);
        Assert.NotNull(meData.TenantId);

        // 6. ONBOARDING: BUSINESS BASICS
        var basicsResponse = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", new BusinessBasicsDto
        {
            BusinessName = "Apex Glazing Systems",
            BusinessType = "Contractor / Trades",
            PrimaryCategory = "Architectural UPVC Windows",
            BusinessEmail = email,
            Website = "https://www.apexglazing.com"
        });
        if (basicsResponse.StatusCode != HttpStatusCode.OK)
        {
            var err = await basicsResponse.Content.ReadAsStringAsync();
            throw new Exception($"basicsResponse failed: {basicsResponse.StatusCode} -> {err}");
        }
        Assert.Equal(HttpStatusCode.OK, basicsResponse.StatusCode);

        // 7. ONBOARDING: ADD SERVICE
        var serviceResponse = await client.PostAsJsonAsync("/api/v1/onboarding/services", new AddServiceRequest
        {
            ServiceName = "Acoustic UPVC Sliding Windows",
            ServiceDescription = "German-engineered multi-point locking sliding sash windows."
        });
        Assert.Equal(HttpStatusCode.OK, serviceResponse.StatusCode);

        // 8. ONBOARDING: LOCATION & CUSTOMERS
        var locationResponse = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", new LocationAndCustomersDto
        {
            AddressLine1 = "789 Skyline Blvd",
            City = "San Jose",
            State = "CA",
            PostalCode = "95110",
            Country = "USA",
            ServiceAreas = new List<string> { "San Jose", "Silicon Valley", "Fremont" },
            TargetCustomers = new List<string> { "Homeowners", "Architects" }
        });
        Assert.Equal(HttpStatusCode.OK, locationResponse.StatusCode);

        // 9. ONBOARDING: BUSINESS DESCRIPTION
        var descResponse = await client.PutAsJsonAsync("/api/v1/onboarding/business-description", new BusinessDescriptionDto
        {
            BusinessDescription = "Specializing in precision UPVC architectural systems.",
            Differentiators = "10-Year warranty and in-house master certified installers."
        });
        Assert.Equal(HttpStatusCode.OK, descResponse.StatusCode);

        // 10. ONBOARDING: APPROVED FACTS
        var factsResponse = await client.PutAsJsonAsync("/api/v1/onboarding/approved-facts", new ApprovedFactsDto
        {
            YearsInBusiness = 14,
            Certifications = new List<string> { "ISO 9001", "AAMA Certified" },
            Awards = new List<string> { "Excellence in Craftsmanship 2024" },
            Accreditations = new List<string> { "BBB A+" },
            Warranties = new List<string> { "10-Year Full Warranty" },
            AuthorizedStatuses = new List<string> { "Authorized Schuco Partner" },
            OtherClaims = new List<string> { "No Subcontractors" }
        });
        Assert.Equal(HttpStatusCode.OK, factsResponse.StatusCode);

        // 11. REVIEW BUSINESS CONTEXT (GET SUMMARY)
        var summaryResponse = await client.GetAsync("/api/v1/onboarding/summary");
        Assert.Equal(HttpStatusCode.OK, summaryResponse.StatusCode);
        var summary = await summaryResponse.Content.ReadFromJsonAsync<BusinessContextSummaryDto>();
        Assert.NotNull(summary);
        Assert.Equal("Apex Glazing Systems", summary.BusinessName);
        Assert.False(summary.IsConfirmed);
        Assert.Single(summary.Services);

        // 12. CONFIRM BUSINESS CONTEXT
        var confirmResponse = await client.PostAsync("/api/v1/onboarding/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        // 13. VERIFY SUMMARY IS NOW CONFIRMED
        var verifiedSummaryResponse = await client.GetAsync("/api/v1/onboarding/summary");
        var confirmedSummary = await verifiedSummaryResponse.Content.ReadFromJsonAsync<BusinessContextSummaryDto>();
        Assert.NotNull(confirmedSummary);
        Assert.True(confirmedSummary.IsConfirmed);

        // 14. ACCESS PROTECTED DASHBOARD
        var dashResponse = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.OK, dashResponse.StatusCode);
    }

    private record CurrentUserDto(string Email, string FullName, string TenantId);
}
