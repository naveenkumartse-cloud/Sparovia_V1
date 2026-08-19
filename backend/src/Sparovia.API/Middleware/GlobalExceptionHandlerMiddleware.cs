using System.Net;
using System.Text.Json;
using Sparovia.Application.Exceptions;
using Sparovia.Domain.Exceptions;

namespace Sparovia.API.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            ValidationException ve => (HttpStatusCode.BadRequest, ve.Message, ve.Errors),
            ConflictException ce => (HttpStatusCode.Conflict, ce.Message, (IReadOnlyDictionary<string, string[]>?)null),
            UnauthorizedException => (HttpStatusCode.Unauthorized, "Unauthorized.", null),
            ForbiddenException => (HttpStatusCode.Forbidden, "Forbidden.", null),
            NotFoundException ne => (HttpStatusCode.NotFound, ne.Message, null),
            DomainException de => (HttpStatusCode.BadRequest, de.Message, null),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.", null)
        };

        // Log unexpected errors with full detail; expected errors at lower severity
        if (statusCode == HttpStatusCode.InternalServerError)
            _logger.LogError(exception, "Unhandled exception. TraceId={TraceId}", context.TraceIdentifier);
        else
            _logger.LogWarning(exception, "Handled exception [{StatusCode}]. TraceId={TraceId}",
                (int)statusCode, context.TraceIdentifier);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            status = (int)statusCode,
            message,
            errors,
            traceId = context.TraceIdentifier
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

public static class GlobalExceptionHandlerMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
}
