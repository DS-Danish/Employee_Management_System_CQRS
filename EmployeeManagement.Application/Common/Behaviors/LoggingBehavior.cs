using MediatR;
using Microsoft.Extensions.Logging;

namespace EmployeeManagement.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        string requestName = typeof(TRequest).Name;

        logger.LogInformation(
            "Handling {RequestName}",
            requestName);

        try
        {
            TResponse response = await next();

            logger.LogInformation(
                "Completed {RequestName}",
                requestName);

            return response;
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "{RequestName} failed",
                requestName);

            throw;
        }
    }
}