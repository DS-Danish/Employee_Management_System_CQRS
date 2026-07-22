using EmployeeManagement.Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
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
        catch (ValidationException exception)
        {
            context.Response.StatusCode =
                StatusCodes.Status400BadRequest;

            ValidationProblemDetails problemDetails = new(
                exception.Errors.ToDictionary(
                    item => item.Key,
                    item => item.Value))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation failed"
            };

            await context.Response.WriteAsJsonAsync(problemDetails);
        }
        catch (InvalidOperationException exception)
        {
            context.Response.StatusCode =
                StatusCodes.Status409Conflict;

            ProblemDetails problemDetails = new()
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Request conflict",
                Detail = exception.Message
            };

            await context.Response.WriteAsJsonAsync(problemDetails);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "An unhandled exception occurred.");

            context.Response.StatusCode =
                StatusCodes.Status500InternalServerError;

            ProblemDetails problemDetails = new()
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal server error",
                Detail = "An unexpected error occurred."
            };

            await context.Response.WriteAsJsonAsync(problemDetails);
        }
    }
}