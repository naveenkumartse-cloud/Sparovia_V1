using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Infrastructure.Data;
using Sparovia.Infrastructure.Storage;
using Sparovia.Infrastructure.Email;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Sparovia API", Version = "v1" });
    
    // Add Cookie Authentication definition for Swagger
    options.AddSecurityDefinition("CookieAuth", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        In = Microsoft.OpenApi.Models.ParameterLocation.Cookie,
        Name = "SparoviaAuth",
        Description = "Cookie-based authentication"
    });
    
    // Add Bearer JWT Authentication definition for Swagger
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });
    
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "CookieAuth"
                }
            },
            Array.Empty<string>()
        },
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("ResendVerification", limiterOptions =>
    {
        limiterOptions.PermitLimit = 3;
        limiterOptions.Window = TimeSpan.FromMinutes(15);
    });
    options.AddFixedWindowLimiter("ForgotPassword", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(15);
    });
    options.AddFixedWindowLimiter("AiOperations", limiterOptions =>
    {
        limiterOptions.PermitLimit = 100;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
    });
    options.AddFixedWindowLimiter("PhoneOtpSend", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
    });
    options.AddFixedWindowLimiter("PhoneOtpVerify", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
    });
    options.AddFixedWindowLimiter("PublicLeadIntake", limiterOptions =>
    {
        limiterOptions.PermitLimit = 30;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
    });
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    Log.Warning("Database connection string is missing or empty.");
}
else
{
    builder.Services.AddDbContext<SparoviaDbContext>(options =>
    {
        options.UseNpgsql(connectionString);
        options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    });
}

// Storage, Email & SMS
builder.Services.AddHttpClient<IStorageProvider, SupabaseStorageProvider>();

// Phone OTP & SMS Services
builder.Services.Configure<PhoneOtpOptions>(builder.Configuration.GetSection(PhoneOtpOptions.SectionName));
builder.Services.AddSingleton<IOtpService, OtpService>();

var smsOptions = Sparovia.Infrastructure.Sms.SmsOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(smsOptions));
builder.Services.AddHttpClient<ISmsService, Sparovia.Infrastructure.Sms.SmsService>();

var smtpOptions = Sparovia.Infrastructure.Email.SmtpOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(smtpOptions));

if (!string.IsNullOrWhiteSpace(smtpOptions.Host) && smtpOptions.EnableDelivery)
{
    if (string.IsNullOrWhiteSpace(smtpOptions.Username) ||
        string.IsNullOrWhiteSpace(smtpOptions.Password) ||
        string.IsNullOrWhiteSpace(smtpOptions.FromEmail))
    {
        Log.Warning("SMTP configuration is incomplete. SmtpEmailService will require valid credentials for delivery.");
    }
    builder.Services.AddScoped<IEmailService, Sparovia.Infrastructure.Email.SmtpEmailService>();
}
else
{
    if (builder.Environment.IsProduction())
    {
        Log.Warning("Production environment detected without SMTP_HOST configured. Using StubEmailService until SMTP is configured in hosting environment.");
    }
    builder.Services.AddSingleton<IEmailService, StubEmailService>();
}

// Identity
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<Sparovia.Application.Onboarding.IOnboardingService, Sparovia.Infrastructure.Onboarding.OnboardingService>();
builder.Services.AddScoped<Sparovia.Application.BusinessPresence.IBusinessPresenceService, Sparovia.Infrastructure.BusinessPresence.BusinessPresenceService>();
builder.Services.AddScoped<Sparovia.Application.WebsiteContent.IWebsiteContentService, Sparovia.Infrastructure.WebsiteContent.WebsiteContentService>();
builder.Services.Configure<Sparovia.Application.Images.ImageUploadOptions>(
    builder.Configuration.GetSection(Sparovia.Application.Images.ImageUploadOptions.SectionName));
builder.Services.AddSingleton<Sparovia.Application.Images.IImageValidator>(sp =>
{
    var opts = sp.GetService<Microsoft.Extensions.Options.IOptions<Sparovia.Application.Images.ImageUploadOptions>>()?.Value;
    return new Sparovia.Application.Images.ImageValidator(opts);
});
builder.Services.AddScoped<Sparovia.Application.Images.IWebsiteImageService, Sparovia.Infrastructure.Images.WebsiteImageService>();
builder.Services.AddSingleton<Sparovia.Application.Images.IImageProcessingService, Sparovia.Infrastructure.Images.DeterministicImageProcessingService>();
builder.Services.AddScoped<Sparovia.Application.Leads.ILeadService, Sparovia.Infrastructure.Leads.LeadService>();

// AI Platform Foundation
builder.Services.Configure<Sparovia.Infrastructure.AI.AIOptions>(
    builder.Configuration.GetSection(Sparovia.Infrastructure.AI.AIOptions.SectionName));
builder.Services.AddSingleton<Sparovia.Application.AI.IAICredentialEncryptionService, Sparovia.Infrastructure.AI.AesGcmAICredentialEncryptionService>();
builder.Services.AddHttpClient<Sparovia.Infrastructure.AI.HttpAIProviderAdapter>();
var aiConfig = builder.Configuration.GetSection(Sparovia.Infrastructure.AI.AIOptions.SectionName).Get<Sparovia.Infrastructure.AI.AIOptions>() ?? new Sparovia.Infrastructure.AI.AIOptions();
if (string.Equals(aiConfig.Provider, "Stub", StringComparison.OrdinalIgnoreCase) && !builder.Environment.IsProduction())
{
    builder.Services.AddScoped<Sparovia.Application.AI.IAIProvider, Sparovia.Infrastructure.AI.StubAIProviderAdapter>();
}
else
{
    builder.Services.AddScoped<Sparovia.Application.AI.IAIProvider, Sparovia.Infrastructure.AI.HttpAIProviderAdapter>();
}
builder.Services.AddScoped<Sparovia.Application.AI.IAIService, Sparovia.Infrastructure.AI.AIService>();

// Authentication - Supports both Cookie and JWT Bearer schemes seamlessly
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "CombinedAuth";
        options.DefaultAuthenticateScheme = "CombinedAuth";
        options.DefaultChallengeScheme = "CombinedAuth";
    })
    .AddPolicyScheme("CombinedAuth", "Cookie or JWT Bearer", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return JwtBearerDefaults.AuthenticationScheme;
            }
            return CookieAuthenticationDefaults.AuthenticationScheme;
        };
    })
    .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
    {
        options.Cookie.Name = "SparoviaAuth";
        options.Cookie.HttpOnly = true;
        var cookieSameSite = builder.Configuration["Cookie:SameSite"];
        if (string.Equals(cookieSameSite, "None", StringComparison.OrdinalIgnoreCase) || builder.Environment.IsProduction())
        {
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.None;
        }
        else
        {
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Lax;
        }
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    })
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        var jwtSecret = builder.Configuration["Jwt:Secret"] 
            ?? "SparoviaDefaultProductionGradeJwtSigningKey2026_EnterpriseGradeSecretKey!";
        var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Sparovia.API";
        var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Sparovia.Client";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
        options.Events = new JwtBearerEvents
        {
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("{\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required.\"}}");
            }
        };
    });

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SparoviaDbContext>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var configuredOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "https://sparovia-v1.vercel.app",
            "https://sparoviapublicsite.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001"
        };

        var envOrigins = builder.Configuration["CORS_ALLOWED_ORIGINS"]?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (envOrigins != null)
        {
            foreach (var o in envOrigins) configuredOrigins.Add(o);
        }

        var configArray = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (configArray != null)
        {
            foreach (var o in configArray)
            {
                if (!string.IsNullOrWhiteSpace(o)) configuredOrigins.Add(o.Trim());
            }
        }

        if (!string.IsNullOrWhiteSpace(builder.Configuration["AdminUrl"]))
            configuredOrigins.Add(builder.Configuration["AdminUrl"]!.Trim());
        if (!string.IsNullOrWhiteSpace(builder.Configuration["PublicUrl"]))
            configuredOrigins.Add(builder.Configuration["PublicUrl"]!.Trim());

        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (configuredOrigins.Contains(origin)) return true;

                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)) return true;
                    if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)) return true;
                }

                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sparovia API v1");
    });
}

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Exception Handling Middleware
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var exception = exceptionFeature?.Error;
        Log.Error(exception, "Unhandled exception in request");

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var isDev = app.Environment.IsDevelopment();
        await context.Response.WriteAsJsonAsync(new { 
            Error = isDev ? (exception?.Message ?? "An unexpected error occurred.") : "An unexpected error occurred.",
            Details = isDev ? exception?.ToString() : null
        });
    });
});

app.MapControllers();

// Health Check Endpoint
app.MapHealthChecks("/api/v1/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            duration = report.TotalDuration.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                error = e.Value.Exception?.Message
            })
        });
        await context.Response.WriteAsync(result);
    }
})
    .WithTags("Health")
    .WithOpenApi();

// Apply pending database migrations on startup if database is configured
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetService<SparoviaDbContext>();
    if (dbContext != null && !string.IsNullOrEmpty(connectionString) && dbContext.Database.IsNpgsql())
    {
        try
        {
            dbContext.Database.Migrate();

            var defaultAdmins = new[]
            {
                (Phone: "9080437109", Name: "Naveen", Password: "Naveen@123"),
                (Phone: "7603922493", Name: "Hari", Password: "Hari@123")
            };

            foreach (var admin in defaultAdmins)
            {
                var normalizedPhone = Sparovia.Application.Common.PhoneNumberHelper.NormalizeIndianPhoneNumber(admin.Phone) ?? $"+91{admin.Phone}";
                var targetUser = dbContext.Users
                    .Include(u => u.Memberships)
                    .FirstOrDefault(u => u.PhoneNumberNormalized == normalizedPhone || u.PhoneNumber == admin.Phone);

                Guid tenantId;
                if (targetUser != null)
                {
                    targetUser.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(admin.Password);
                    targetUser.PhoneVerified = true;
                    targetUser.EmailVerified = true;
                    if (!targetUser.Memberships.Any())
                    {
                        var tenant = new Sparovia.Domain.Entities.Tenant { Name = $"{targetUser.FullName}'s Workspace" };
                        dbContext.Tenants.Add(tenant);
                        tenantId = tenant.Id;
                        dbContext.Memberships.Add(new Sparovia.Domain.Entities.Membership
                        {
                            UserId = targetUser.Id,
                            User = targetUser,
                            TenantId = tenant.Id,
                            Tenant = tenant,
                            Role = "Owner"
                        });
                    }
                    else
                    {
                        tenantId = targetUser.Memberships.First().TenantId;
                    }
                    dbContext.SaveChanges();
                    Log.Information("Synchronized credentials for phone {Phone}", targetUser.PhoneNumber);
                }
                else
                {
                    var newUser = new Sparovia.Domain.Entities.User
                    {
                        FullName = admin.Name,
                        PhoneNumber = admin.Phone,
                        PhoneNumberNormalized = normalizedPhone,
                        PhoneVerified = true,
                        Email = $"{normalizedPhone.TrimStart('+')}@user.sparovia.com",
                        NormalizedEmail = $"{normalizedPhone.TrimStart('+')}@user.sparovia.com".ToUpperInvariant(),
                        PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(admin.Password),
                        EmailVerified = true
                    };
                    dbContext.Users.Add(newUser);

                    var tenant = new Sparovia.Domain.Entities.Tenant
                    {
                        Name = $"{admin.Name}'s Workspace"
                    };
                    dbContext.Tenants.Add(tenant);
                    tenantId = tenant.Id;

                    var membership = new Sparovia.Domain.Entities.Membership
                    {
                        UserId = newUser.Id,
                        User = newUser,
                        TenantId = tenant.Id,
                        Tenant = tenant,
                        Role = "Owner"
                    };
                    dbContext.Memberships.Add(membership);

                    dbContext.SaveChanges();
                    Log.Information("Provisioned account for phone {Phone}", newUser.PhoneNumber);
                }

                var existingContext = dbContext.BusinessContexts.FirstOrDefault(bc => bc.TenantId == tenantId);
                if (existingContext == null)
                {
                    dbContext.BusinessContexts.Add(new Sparovia.Domain.Entities.BusinessContext
                    {
                        TenantId = tenantId,
                        BusinessName = $"{admin.Name} Interiors",
                        BusinessType = "Interior Design",
                        PrimaryCategory = "Residential",
                        BusinessEmail = $"{normalizedPhone.TrimStart('+')}@user.sparovia.com",
                        IsConfirmed = true,
                        ConfirmedAt = DateTime.UtcNow
                    });
                    dbContext.SaveChanges();
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Could not apply database migrations automatically on startup.");
        }
    }
}

try
{
    Log.Information("Starting web application");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
