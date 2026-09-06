using Serilog;
using Sparovia.Application;
using Sparovia.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, loggerConfiguration) =>
{
    loggerConfiguration.ReadFrom.Configuration(context.Configuration);
});

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddMemoryCache();
builder.Services.AddHealthChecks()
    .AddDbContextCheck<Sparovia.Infrastructure.Persistence.SparoviaDbContext>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCorsPolicy", policy =>
    {
        var frontendUrl = builder.Configuration.GetValue<string>("FrontendUrl");
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            policy.WithOrigins(frontendUrl)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.UseCors("FrontendCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/api/v1/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }));
app.MapHealthChecks("/api/v1/health/database");

app.Run();
