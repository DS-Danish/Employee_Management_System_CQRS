using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Infrastructure.Identity;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
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
            configuration.GetConnectionString(
                "DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' was not found.");

        services.AddDbContext<ApplicationDbContext>(
            options =>
            {
                options.UseSqlServer(
                    connectionString,
                    sqlServerOptions =>
                    {
                        sqlServerOptions.MigrationsAssembly(
                            typeof(ApplicationDbContext)
                                .Assembly
                                .FullName);
                    });
            });

        services.AddScoped<IApplicationDbContext>(
            serviceProvider =>
                serviceProvider
                    .GetRequiredService<ApplicationDbContext>());

        services
            .AddIdentityCore<ApplicationUser>(
                options =>
                {
                    options.User.RequireUniqueEmail =
                        true;

                    /*
                     * Development-only password rules.
                     */
                    options.Password.RequiredLength =
                        5;

                    options.Password.RequireDigit =
                        false;

                    options.Password.RequireLowercase =
                        false;

                    options.Password.RequireUppercase =
                        false;

                    options.Password.RequireNonAlphanumeric =
                        false;

                    options.Lockout.AllowedForNewUsers =
                        true;

                    options.Lockout.MaxFailedAccessAttempts =
                        5;

                    options.Lockout.DefaultLockoutTimeSpan =
                        TimeSpan.FromMinutes(15);
                })
            .AddRoles<IdentityRole>()
            .AddSignInManager<
                SignInManager<ApplicationUser>>()
            .AddEntityFrameworkStores<
                ApplicationDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }
}