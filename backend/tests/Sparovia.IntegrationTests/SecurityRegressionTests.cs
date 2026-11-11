using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;
using Sparovia.Application.Images;
using Sparovia.Application.Leads;
using Sparovia.Application.Onboarding;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;
using Xunit;

namespace Sparovia.IntegrationTests;

public class SecurityRegressionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SecurityRegressionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SecurityHeaders_AreEmittedOnResponses()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/health");

        // Assert
        Assert.True(response.Headers.Contains("X-Content-Type-Options"), "Response must contain X-Content-Type-Options");
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").FirstOrDefault());

        Assert.True(response.Headers.Contains("X-Frame-Options"), "Response must contain X-Frame-Options");
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").FirstOrDefault());

        Assert.True(response.Headers.Contains("Referrer-Policy"), "Response must contain Referrer-Policy");
        Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").FirstOrDefault());

        Assert.True(response.Headers.Contains("Permissions-Policy"), "Response must contain Permissions-Policy");
    }

    [Fact]
    public async Task CORS_ArbitraryVercelSubdomain_IsRejected()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/leads/public");
        request.Headers.Add("Origin", "https://attacker-controlled.vercel.app");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await client.SendAsync(request);

        // Assert: Attacker vercel domain must NOT receive Access-Control-Allow-Origin
        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"),
            "Arbitrary .vercel.app domain must NOT be allowed by CORS.");
    }

    [Fact]
    public async Task CORS_ApprovedFrontendOrigin_IsAllowedWithCredentials()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/leads/public");
        request.Headers.Add("Origin", "https://sparovia-v1.vercel.app");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.Equal("https://sparovia-v1.vercel.app", response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault());
        Assert.True(response.Headers.Contains("Access-Control-Allow-Credentials"));
        Assert.Equal("true", response.Headers.GetValues("Access-Control-Allow-Credentials").FirstOrDefault());
    }

    [Fact]
    public async Task ImageFile_WithForgedUnsignedJwtToken_IsRejectedAndDoesNotGrantPrivateAccess()
    {
        // Arrange: Create an unsigned JWT token with arbitrary TenantId
        var victimTenantId = Guid.NewGuid();
        var fakeTokenHandler = new JwtSecurityTokenHandler();
        var fakeToken = fakeTokenHandler.WriteToken(new JwtSecurityToken(
            claims: new[] { new Claim("TenantId", victimTenantId.ToString()) }
        ));

        var client = _factory.CreateClient();
        var randomImageId = Guid.NewGuid();

        // Act: Attempt to access image using forged unverified token
        var response = await client.GetAsync($"/api/v1/website/images/{randomImageId}/file?token={fakeToken}");

        // Assert: Must return 404 Not Found (or 401), NOT granting access
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PublicLeadIntake_WithUnknownDomain_ReturnsNotFound_DoesNotRouteToOtherTenant()
    {
        // Arrange: Seed a tenant with a legitimate website
        var legitimateDomain = $"studio-{Guid.NewGuid():N}.com";
        Guid tenantId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var tenant = new Tenant { Id = Guid.NewGuid(), Name = "Legitimate Studio" };
            var website = new Website
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Name = "Legitimate Site",
                Domain = legitimateDomain,
                ConnectionStatus = "Connected"
            };
            db.Tenants.Add(tenant);
            db.Websites.Add(website);
            await db.SaveChangesAsync();
            tenantId = tenant.Id;
        }

        var client = _factory.CreateClient();
        var unknownDomain = $"attacker-spoofed-domain-{Guid.NewGuid():N}.org";
        var leadPayload = new
        {
            Name = "Secret Customer Inquiry",
            Phone = "+919876543210",
            Email = "customer@domain.com",
            Message = "Confidential project inquiry",
            Domain = unknownDomain
        };

        // Act: Post inquiry with unknown domain
        var response = await client.PostAsJsonAsync("/api/v1/leads/public", leadPayload);

        // Assert: Must be rejected with 404 (TENANT_NOT_FOUND)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Verify in database: Lead must NOT have been deposited into the legitimate tenant's account!
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var leakedLead = await db.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Email == "customer@domain.com");
            Assert.Null(leakedLead);
        }
    }

    [Fact]
    public async Task PublicPublishedContent_WithUnknownDomain_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();
        var unknownDomain = $"non-existent-{Guid.NewGuid():N}.net";

        // Act
        var response = await client.GetAsync($"/api/v1/website/published-content?domain={unknownDomain}");

        // Assert: Must return 404, never silently serve another tenant's website
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task WhatsAppWebhook_WithMissingOrInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var tenantId = Guid.NewGuid();
        var payload = new WhatsAppLeadWebhookRequest
        {
            CustomerName = "Test Prospect",
            Phone = "+919876543210",
            Message = "Hello from WhatsApp"
        };

        // Act 1: No header
        var requestNoHeader = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/leads/webhook/whatsapp?tenantId={tenantId}")
        {
            Content = JsonContent.Create(payload)
        };
        var responseNoHeader = await client.SendAsync(requestNoHeader);
        Assert.Equal(HttpStatusCode.Unauthorized, responseNoHeader.StatusCode);

        // Act 2: Invalid token
        var requestBadToken = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/leads/webhook/whatsapp?tenantId={tenantId}")
        {
            Content = JsonContent.Create(payload)
        };
        requestBadToken.Headers.Add("X-WhatsApp-Token", "invalid-forged-token-value");
        var responseBadToken = await client.SendAsync(requestBadToken);
        Assert.Equal(HttpStatusCode.Unauthorized, responseBadToken.StatusCode);
    }

    [Fact]
    public async Task WhatsAppWebhook_WithValidToken_ProcessesSuccessfully()
    {
        // Arrange: Seed target tenant
        Guid tenantId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var tenant = new Tenant { Id = Guid.NewGuid(), Name = "WhatsApp Verified Workspace" };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();
            tenantId = tenant.Id;
        }

        var client = _factory.CreateClient();
        var payload = new WhatsAppLeadWebhookRequest
        {
            CustomerName = "Verified WhatsApp Prospect",
            Phone = "+919876543210",
            Message = "I would like to inquire about services"
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/leads/webhook/whatsapp?tenantId={tenantId}")
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("X-WhatsApp-Token", "sparovia_wa_webhook_secret_key_v1");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify Lead was created with channel WhatsApp
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var lead = await db.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Name == "Verified WhatsApp Prospect");
            Assert.NotNull(lead);
            Assert.Equal("WhatsApp", lead.Source);
        }
    }

    [Fact]
    public async Task DevOtp_IsNotDisclosedInProductionEnvironment()
    {
        // Arrange: Create a client hosted in Production environment
        var defaultConn = _factory.Services.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()["ConnectionStrings:DefaultConnection"];
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Jwt:Secret", "A_Valid_Production_Secret_For_Otp_Test_2026_Secure!!");
            if (!string.IsNullOrEmpty(defaultConn))
            {
                builder.UseSetting("ConnectionStrings:DefaultConnection", defaultConn);
            }
        });
        var client = prodFactory.CreateClient();

        var phone = "9876543299";
        var regReq = new RegisterRequest
        {
            FullName = "Production Privacy User",
            Email = $"privacy-{Guid.NewGuid():N}@sparovia.com",
            PhoneNumber = phone,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", regReq);
        var content = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Register failed with {response.StatusCode}: {content}");
        using var jsonDoc = JsonDocument.Parse(content);
        var data = jsonDoc.RootElement.GetProperty("data");

        Assert.False(data.TryGetProperty("devOtp", out _), "devOtp MUST NOT be returned in Production environment.");
        Assert.False(data.TryGetProperty("devVerificationUrl", out _), "devVerificationUrl MUST NOT be returned in Production environment.");
    }

    [Fact]
    public void ProductionStartup_WithoutJwtSecret_ThrowsInvalidOperationException()
    {
        // Arrange
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Jwt:Secret", "");
            builder.UseSetting("JWT_SECRET", "");
        });

        // Act & Assert: Must fail safely during startup
        var ex = Assert.Throws<InvalidOperationException>(() => prodFactory.CreateClient());
        Assert.Contains("missing", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Production", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ProductionStartup_WithInsecureDefaultFallback_ThrowsInvalidOperationException()
    {
        // Arrange
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Jwt:Secret", Sparovia.Infrastructure.Security.SigningSecretProvider.InsecureDevelopmentSecret);
            builder.UseSetting("JWT_SECRET", "");
        });

        // Act & Assert: Insecure default fallback is strictly forbidden in Production
        var ex = Assert.Throws<InvalidOperationException>(() => prodFactory.CreateClient());
        Assert.Contains("Insecure fallback", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProductionStartup_WithStrongSecret_StartsSuccessfully()
    {
        // Arrange: Strong 64-char key in Production
        var defaultConn = _factory.Services.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()["ConnectionStrings:DefaultConnection"];
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Jwt:Secret", "A_Very_Strong_Production_Secret_Key_For_Sparovia_Platform_2026_Secure!");
            builder.UseSetting("JWT_SECRET", "");
            if (!string.IsNullOrEmpty(defaultConn))
            {
                builder.UseSetting("ConnectionStrings:DefaultConnection", defaultConn);
            }
        });

        // Act
        var client = prodFactory.CreateClient();
        var response = await client.GetAsync("/api/v1/health");

        // Assert: Application starts cleanly and serves health check
        Assert.True(response.IsSuccessStatusCode);
    }

    [Fact]
    public async Task ImageFile_WithForgedHmacSignature_IsRejected()
    {
        // Arrange
        var client = _factory.CreateClient();
        var randomImageId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();
        var forgedSig = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

        // Act: Attempt to access image with forged signature
        var response = await client.GetAsync($"/api/v1/website/images/{randomImageId}/file?sig={forgedSig}&exp={exp}");

        // Assert: Must return 404 Not Found, never leaking private file or granting access
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ImageFile_WithExpiredHmacSignature_IsRejected()
    {
        // Arrange
        var client = _factory.CreateClient();
        var randomImageId = Guid.NewGuid();
        var expiredTime = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeSeconds();
        var sig = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

        // Act
        var response = await client.GetAsync($"/api/v1/website/images/{randomImageId}/file?sig={sig}&exp={expiredTime}");

        // Assert: Expired signed URLs must be rejected
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static byte[] CreateValidJpegBytes()
    {
        using var bmp = new SkiaSharp.SKBitmap(1200, 800, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul);
        using (var canvas = new SkiaSharp.SKCanvas(bmp))
        {
            canvas.Clear(new SkiaSharp.SKColor(50, 90, 170));
        }
        using var img = SkiaSharp.SKImage.FromBitmap(bmp);
        using var data = img.Encode(SkiaSharp.SKEncodedImageFormat.Jpeg, 85);
        return data.ToArray();
    }

    private static MultipartFormDataContent CreateImageMultipartContent(byte[] imageBytes, string fileName, string contentType, string? usageType = null, string? slot = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);

        if (!string.IsNullOrWhiteSpace(usageType))
            content.Add(new StringContent(usageType), "usageType");
        if (!string.IsNullOrWhiteSpace(slot))
            content.Add(new StringContent(slot), "slot");

        return content;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "HMAC Security Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            db.Database.Migrate();
            var user = db.Users.Single(u => u.Email == email);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        var loginReq = new SignInRequest
        {
            Email = email,
            Password = "StrongPassword123!"
        };
        await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);

        return client;
    }

    private async Task SetupAndConfirmBusinessContextAsync(HttpClient client, string businessName, string email)
    {
        var basics = new BusinessBasicsDto
        {
            BusinessName = businessName,
            BusinessType = "Local Service Business",
            PrimaryCategory = "Interiors",
            BusinessPhone = "+1 555-0199",
            BusinessEmail = email,
            Website = "https://example.com"
        };
        var r1 = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        r1.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Security Way",
            City = "Tech City",
            State = "CA",
            PostalCode = "94016",
            Country = "United States",
            ServiceAreas = new List<string> { "Greater Metro" }
        };
        var r2 = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        r2.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Interior Woodwork", ServiceDescription = "Cabinetry" };
        var r3 = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        r3.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task HMAC_Verification_AgainstRealExistingImageAndVariantResources_EnforcesAllTenSecurityGuarantees()
    {
        // 1. Arrange: Setup Tenant A with confirmed context and upload an image
        var emailA = $"hmac_sec_a_{Guid.NewGuid():N}@test.local";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "HMAC Secure Studio A", emailA);

        var jpegBytes = CreateValidJpegBytes();
        var formA = CreateImageMultipartContent(jpegBytes, "hmac_test_hero.jpg", "image/jpeg", "WebsiteImage", "heroImage");

        var uploadResp = await clientA.PostAsync("/api/v1/website/images", formA);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);

        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imgData = uploadBody.GetProperty("data");
        var realImageId = Guid.Parse(imgData.GetProperty("id").GetString()!);
        var previewUrl = imgData.GetProperty("previewUrl").GetString()!;

        // Extract sig and exp from the backend-generated previewUrl
        var uri = new Uri("http://localhost" + previewUrl);
        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        var validSig = query["sig"]!;
        var validExpStr = query["exp"]!;
        var validExp = long.Parse(validExpStr);

        // Enhance image to generate a real variant
        var enhanceResp = await clientA.PostAsJsonAsync($"/api/v1/website/images/{realImageId}/enhance", new
        {
            operation = "ImproveClarity",
            preset = "Balanced"
        });
        Assert.Equal(HttpStatusCode.Created, enhanceResp.StatusCode);
        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantData = enhanceBody.GetProperty("data");
        var realVariantId = Guid.Parse(variantData.GetProperty("id").GetString()!);
        var variantPreviewUrl = variantData.GetProperty("previewUrl").GetString()!;

        var variantUri = new Uri("http://localhost" + variantPreviewUrl);
        var variantQuery = System.Web.HttpUtility.ParseQueryString(variantUri.Query);
        var validVariantSig = variantQuery["sig"]!;
        var validVariantExp = long.Parse(variantQuery["exp"]!);

        // Prepare Unauthenticated Client (simulating public web / <img> tags)
        var unauthClient = _factory.CreateClient();

        // ── TEST 1: Valid original image signature retrieves the correct image (HTTP 200) ──
        var resp1 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/file?sig={validSig}&exp={validExp}");
        Assert.Equal(HttpStatusCode.OK, resp1.StatusCode);
        Assert.Equal("image/jpeg", resp1.Content.Headers.ContentType?.MediaType);
        var bytes1 = await resp1.Content.ReadAsByteArrayAsync();
        Assert.True(bytes1.Length > 0);

        // ── TEST 2: Modified signature on existing image is rejected (HTTP 404) ──
        var tamperedSig = validSig.Substring(0, validSig.Length - 4) + "beef";
        var resp2 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/file?sig={tamperedSig}&exp={validExp}");
        Assert.Equal(HttpStatusCode.NotFound, resp2.StatusCode);

        // ── TEST 3: Modified image ID is rejected (HTTP 404) ──
        var differentImageId = Guid.NewGuid();
        var resp3 = await unauthClient.GetAsync($"/api/v1/website/images/{differentImageId}/file?sig={validSig}&exp={validExp}");
        Assert.Equal(HttpStatusCode.NotFound, resp3.StatusCode);

        // ── TEST 4: Modified tenant ID is rejected by database ownership validation (HTTP 404) ──
        var fakeTenantId = Guid.NewGuid();
        string fakeTenantSig;
        using (var scope = _factory.Services.CreateScope())
        {
            var imgService = scope.ServiceProvider.GetRequiredService<IWebsiteImageService>();
            fakeTenantSig = imgService.GenerateImageSignature(realImageId, fakeTenantId, validExp);
        }
        var resp4 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/file?sig={fakeTenantSig}&exp={validExp}");
        Assert.Equal(HttpStatusCode.NotFound, resp4.StatusCode);

        // ── TEST 5: Expired signature is rejected (HTTP 404) ──
        var pastTimestamp = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeSeconds();
        string expiredSig;
        Guid actualTenantId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var img = await db.Images.AsNoTracking().FirstAsync(i => i.Id == realImageId);
            actualTenantId = img.TenantId;
            var imgService = scope.ServiceProvider.GetRequiredService<IWebsiteImageService>();
            expiredSig = imgService.GenerateImageSignature(realImageId, actualTenantId, pastTimestamp);
        }
        var resp5 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/file?sig={expiredSig}&exp={pastTimestamp}");
        Assert.Equal(HttpStatusCode.NotFound, resp5.StatusCode);

        // ── TEST 6: Valid variant signature retrieves the intended variant (HTTP 200) ──
        var resp6 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/variants/{realVariantId}/file?sig={validVariantSig}&exp={validVariantExp}");
        Assert.Equal(HttpStatusCode.OK, resp6.StatusCode);
        var bytes6 = await resp6.Content.ReadAsByteArrayAsync();
        Assert.True(bytes6.Length > 0);

        // ── TEST 7: Modified variant ID is rejected (HTTP 404) ──
        var fakeVariantId = Guid.NewGuid();
        var resp7 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/variants/{fakeVariantId}/file?sig={validVariantSig}&exp={validVariantExp}");
        Assert.Equal(HttpStatusCode.NotFound, resp7.StatusCode);

        // ── TEST 8: Original image signature cannot retrieve a variant (HTTP 404) ──
        var resp8 = await unauthClient.GetAsync($"/api/v1/website/images/{realImageId}/variants/{realVariantId}/file?sig={validSig}&exp={validExp}");
        Assert.Equal(HttpStatusCode.NotFound, resp8.StatusCode);

        // ── TEST 9: Variant signature cannot retrieve another image's variant (HTTP 404) ──
        var formA2 = CreateImageMultipartContent(jpegBytes, "second_image.jpg", "image/jpeg", "WebsiteImage", "secondaryImage");
        var upload2Resp = await clientA.PostAsync("/api/v1/website/images", formA2);
        var upload2Body = await upload2Resp.Content.ReadFromJsonAsync<JsonElement>();
        var image2Id = Guid.Parse(upload2Body.GetProperty("data").GetProperty("id").GetString()!);

        var enhance2Resp = await clientA.PostAsJsonAsync($"/api/v1/website/images/{image2Id}/enhance", new
        {
            operation = "ImproveClarity",
            preset = "Balanced"
        });
        var enhance2Body = await enhance2Resp.Content.ReadFromJsonAsync<JsonElement>();
        var variant2Id = Guid.Parse(enhance2Body.GetProperty("data").GetProperty("id").GetString()!);

        var resp9 = await unauthClient.GetAsync($"/api/v1/website/images/{image2Id}/variants/{variant2Id}/file?sig={validVariantSig}&exp={validVariantExp}");
        Assert.Equal(HttpStatusCode.NotFound, resp9.StatusCode);

        // ── TEST 10: Cross-tenant access is rejected (HTTP 404) ──
        var emailB = $"hmac_sec_b_{Guid.NewGuid():N}@test.local";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "HMAC Secure Studio B", emailB);

        var crossTenantImgResp = await clientB.GetAsync($"/api/v1/website/images/{realImageId}");
        Assert.Equal(HttpStatusCode.NotFound, crossTenantImgResp.StatusCode);

        var crossTenantVariantResp = await clientB.GetAsync($"/api/v1/website/images/{realImageId}/variants/{realVariantId}");
        Assert.Equal(HttpStatusCode.NotFound, crossTenantVariantResp.StatusCode);
    }
}
