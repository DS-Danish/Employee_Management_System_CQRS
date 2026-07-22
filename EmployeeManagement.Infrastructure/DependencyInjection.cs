using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EmployeeManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        string connectionString =
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "DefaultConnection is not configured.");

        services.AddDbContext<ApplicationDbContext>(
            options =>
            {
                options.UseSqlServer(connectionString);
            });

        services.AddScoped<IApplicationDbContext>(
            serviceProvider =>
                serviceProvider.GetRequiredService<ApplicationDbContext>());

        return services;
    }
}