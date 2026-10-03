using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
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

// Storage & Email
builder.Services.AddSingleton<IStorageProvider, StubStorageProvider>();
builder.Services.AddSingleton<IEmailService, StubEmailService>();

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

// AI Platform Foundation
builder.Services.Configure<Sparovia.Infrastructure.AI.AIOptions>(
    builder.Configuration.GetSection(Sparovia.Infrastructure.AI.AIOptions.SectionName));
builder.Services.AddSingleton<Sparovia.Application.AI.IAICredentialEncryptionService, Sparovia.Infrastructure.AI.AesGcmAICredentialEncryptionService>();
builder.Services.AddHttpClient<Sparovia.Infrastructure.AI.HttpAIProviderAdapter>();
var aiConfig = builder.Configuration.GetSection(Sparovia.Infrastructure.AI.AIOptions.SectionName).Get<Sparovia.Infrastructure.AI.AIOptions>() ?? new Sparovia.Infrastructure.AI.AIOptions();
if (string.Equals(aiConfig.Provider, "Http", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(aiConfig.ApiKey))
{
    builder.Services.AddScoped<Sparovia.Application.AI.IAIProvider, Sparovia.Infrastructure.AI.HttpAIProviderAdapter>();
}
else
{
    builder.Services.AddScoped<Sparovia.Application.AI.IAIProvider, Sparovia.Infrastructure.AI.StubAIProviderAdapter>();
}
builder.Services.AddScoped<Sparovia.Application.AI.IAIService, Sparovia.Infrastructure.AI.AIService>();

// Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
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
    });

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SparoviaDbContext>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration["CORS_ALLOWED_ORIGINS"]?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? Array.Empty<string>();

        policy
            .WithOrigins(origins)
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
app.MapHealthChecks("/api/v1/health")
    .WithTags("Health")
    .WithOpenApi();

// Apply pending database migrations on startup if database is configured
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetService<SparoviaDbContext>();
    if (dbContext != null && !string.IsNullOrEmpty(connectionString))
    {
        try
        {
            dbContext.Database.Migrate();
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
