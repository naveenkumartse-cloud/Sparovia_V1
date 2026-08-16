using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Sparovia.API.Middleware;
using Sparovia.Application;
using Sparovia.Infrastructure;
using Sparovia.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ─────────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// ─── Application + Infrastructure ────────────────────────────────────────────
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtSecret = jwtSettings["Secret"]
    ?? throw new InvalidOperationException("JWT Secret is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ─── CORS ────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SparoviaFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH");
        }
    });
});

// ─── Controllers + Swagger ───────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Sparovia API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token. Example: Bearer {token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
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

// ─── Health Checks ───────────────────────────────────────────────────────────
builder.Services.AddHealthChecks();

var app = builder.Build();

// ─── Middleware Pipeline ─────────────────────────────────────────────────────
app.UseGlobalExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sparovia API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("SparoviaFrontend");
app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/api/health");

// ─── Auto-migrate on startup (development only) ───────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
    try
    {
        db.Database.Migrate();
        Log.Information("Database migration applied successfully.");
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Database migration could not be applied. Ensure PostgreSQL is running.");
    }
}

Log.Information("Sparovia API starting up.");
app.Run();

// Required for integration test WebApplicationFactory
public partial class Program { }
