using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.DTOs.Auth;
using Sparovia.Application.DTOs.Business;
using Sparovia.Infrastructure.Persistence;
using Sparovia.IntegrationTests.Infrastructure;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Sparovia.IntegrationTests.Api;

[Collection("Integration")]
public class ApiIntegrationTests : IClassFixture<IntegrationTestFactory>
{
    private readonly HttpClient _client;
    private readonly IntegrationTestFactory _factory;

    public ApiIntegrationTests(IntegrationTestFactory factory)
    {
        _factory = factory;
        _client = factory.Client;
        EnsureDatabaseMigrated();
    }

    private void EnsureDatabaseMigrated()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        db.Database.Migrate();
    }

    private async Task<AuthResponse> RegisterAndLogin(string email, string password = "Password1!")
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, password, "Test", "User"));

        var loginResp = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(email, password));

        return await loginResp.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new Exception("Login failed in test setup.");
    }

    private HttpClient CreateAuthenticatedClient(string token)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // Test 1: User registration — success
    [Fact]
    public async Task Register_ValidRequest_Returns201()
    {
        var resp = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("reg1@test.com", "Password1!", "Alice", "Smith"));

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await resp.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Token.Should().NotBeNullOrEmpty();
        body.User.Email.Should().Be("reg1@test.com");
    }

    // Test 2: Duplicate registration
    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("dup@test.com", "Password1!", "Bob", "Jones"));
        var resp = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("dup@test.com", "Password1!", "Bob", "Jones"));

        resp.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    // Test 3: Valid login
    [Fact]
    public async Task Login_ValidCredentials_Returns200WithToken()
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("login_ok@test.com", "Password1!", "Carl", "D"));

        var resp = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("login_ok@test.com", "Password1!"));

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Token.Should().NotBeNullOrEmpty();
    }

    // Test 4: Invalid login
    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("badinput@test.com", "Password1!", "X", "Y"));

        var resp = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("badinput@test.com", "WrongPass999!"));

        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Test 5: Protected endpoint without token
    [Fact]
    public async Task Me_NoToken_Returns401()
    {
        var resp = await _client.GetAsync("/api/auth/me");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Test 6: Authenticated endpoint
    [Fact]
    public async Task Me_WithToken_Returns200()
    {
        var auth = await RegisterAndLogin("me_test@test.com");
        var authedClient = CreateAuthenticatedClient(auth.Token);

        var resp = await authedClient.GetAsync("/api/auth/me");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // Test 7: Business creation
    [Fact]
    public async Task CreateBusiness_Authenticated_Returns201()
    {
        var auth = await RegisterAndLogin("biz_create@test.com");
        var authedClient = CreateAuthenticatedClient(auth.Token);

        var resp = await authedClient.PostAsJsonAsync("/api/businesses",
            new CreateBusinessRequest("My Biz", "my-biz-1", "Retail", null));

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await resp.Content.ReadFromJsonAsync<BusinessResponse>();
        body!.Name.Should().Be("My Biz");
        body.Slug.Should().Be("my-biz-1");
    }

    // Test 8: Owner membership created atomically
    [Fact]
    public async Task CreateBusiness_OwnerMembershipIsCreated()
    {
        var auth = await RegisterAndLogin("owner_test@test.com");
        var authedClient = CreateAuthenticatedClient(auth.Token);

        var resp = await authedClient.PostAsJsonAsync("/api/businesses",
            new CreateBusinessRequest("Owner Biz", "owner-biz-88", "Tech", null));
        var biz = await resp.Content.ReadFromJsonAsync<BusinessResponse>();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var membership = await db.Memberships
            .FirstOrDefaultAsync(m => m.BusinessId == biz!.Id);

        membership.Should().NotBeNull();
        membership!.Role.Should().Be(Sparovia.Domain.Enums.MembershipRole.Owner);
    }

    // Test 9: Authorized business access
    [Fact]
    public async Task GetBusiness_Owner_Returns200()
    {
        var auth = await RegisterAndLogin("get_biz@test.com");
        var authedClient = CreateAuthenticatedClient(auth.Token);

        var createResp = await authedClient.PostAsJsonAsync("/api/businesses",
            new CreateBusinessRequest("Get Biz", "get-biz-1", "Finance", null));
        var biz = await createResp.Content.ReadFromJsonAsync<BusinessResponse>();

        var getResp = await authedClient.GetAsync($"/api/businesses/{biz!.Id}");
        getResp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // Test 10: Unauthorized access to someone else's business
    [Fact]
    public async Task GetBusiness_WrongUser_Returns403()
    {
        // User A creates business
        var authA = await RegisterAndLogin("user_a@test.com");
        var clientA = CreateAuthenticatedClient(authA.Token);
        var createResp = await clientA.PostAsJsonAsync("/api/businesses",
            new CreateBusinessRequest("A Biz", "a-biz-77", "Health", null));
        var biz = await createResp.Content.ReadFromJsonAsync<BusinessResponse>();

        // User B tries to access User A's business
        var authB = await RegisterAndLogin("user_b@test.com");
        var clientB = CreateAuthenticatedClient(authB.Token);

        var resp = await clientB.GetAsync($"/api/businesses/{biz!.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // Test 11: MANDATORY — Tenant isolation
    [Fact]
    public async Task TenantIsolation_UserACannotAccessBusinessB()
    {
        // Business A
        var authA = await RegisterAndLogin("tenant_a@test.com");
        var clientA = CreateAuthenticatedClient(authA.Token);
        var bizAResp = await clientA.PostAsJsonAsync("/api/businesses",
            new CreateBusinessRequest("Business A", "tenant-biz-a", "Retail", "Business belonging to User A"));
        var bizA = await bizAResp.Content.ReadFromJsonAsync<BusinessResponse>();

        // Business B (different user)
        var authB = await RegisterAndLogin("tenant_b@test.com");
        var clientB = CreateAuthenticatedClient(authB.Token);
        await clientB.PostAsJsonAsync("/api/businesses",
            new CreateBusinessRequest("Business B", "tenant-biz-b", "Tech", "Business belonging to User B"));

        // User A tries to access Business B's ID — MUST be denied
        var resp = await clientA.GetAsync($"/api/businesses/{Guid.NewGuid()}"); // random ID
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden, "tenant isolation must prevent cross-tenant access");
    }

    // Test 12: Health check
    [Fact]
    public async Task HealthCheck_Returns200()
    {
        var resp = await _client.GetAsync("/api/health");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
