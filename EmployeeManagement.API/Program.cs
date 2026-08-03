using System.Security.Claims;
using System.Text;
using EmployeeManagement.API.Middleware;
using EmployeeManagement.API.Services;
using EmployeeManagement.Application;
using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Infrastructure;
using EmployeeManagement.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using EmployeeManagement.Application.Common.Constants;

WebApplicationBuilder builder =
    WebApplication.CreateBuilder(args);

const string ReactCorsPolicy =
    "ReactFrontend";

builder.Services.AddControllers();

builder.Services.AddApplication();

builder.Services.AddInfrastructure(
    builder.Configuration);

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<
    ICurrentUserService,
    CurrentUserService>();

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            ReactCorsPolicy,
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

JwtSettings jwtSettings =
    builder.Configuration
        .GetSection(JwtSettings.SectionName)
        .Get<JwtSettings>()
    ?? throw new InvalidOperationException(
        "The Jwt configuration section was not found.");

if (string.IsNullOrWhiteSpace(
        jwtSettings.Key))
{
    throw new InvalidOperationException(
        "Jwt:Key is required.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.Issuer))
{
    throw new InvalidOperationException(
        "Jwt:Issuer is required.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.Audience))
{
    throw new InvalidOperationException(
        "Jwt:Audience is required.");
}

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(
        JwtSettings.SectionName));

builder.Services
    .AddAuthentication(
        options =>
        {
            options.DefaultAuthenticateScheme =
                JwtBearerDefaults.AuthenticationScheme;

            options.DefaultChallengeScheme =
                JwtBearerDefaults.AuthenticationScheme;

            options.DefaultScheme =
                JwtBearerDefaults.AuthenticationScheme;
        })
    .AddJwtBearer(
        options =>
        {
            options.RequireHttpsMetadata =
                false;

            options.SaveToken =
                true;

            options.TokenValidationParameters =
                new TokenValidationParameters
                {
                    ValidateIssuer =
                        true,

                    ValidIssuer =
                        jwtSettings.Issuer,

                    ValidateAudience =
                        true,

                    ValidAudience =
                        jwtSettings.Audience,

                    ValidateIssuerSigningKey =
                        true,

                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(
                                jwtSettings.Key)),

                    ValidateLifetime =
                        true,

                    ClockSkew =
                        TimeSpan.Zero,

                    RoleClaimType =
                        ClaimTypes.Role,

                    NameClaimType =
                        ClaimTypes.NameIdentifier
                };
        });

builder.Services.AddAuthorization(
    options =>
    {
        options.AddPolicy(
            AuthorizationPolicies.ViewEmployees,
            policy =>
            {
                policy.RequireRole(
                    AppRoles.SuperAdmin,
                    AppRoles.TeamLead);
            });

        options.AddPolicy(
            AuthorizationPolicies.ManageEmployees,
            policy =>
            {
                policy.RequireRole(
                    AppRoles.SuperAdmin,
                    AppRoles.TeamLead);
            });

        options.AddPolicy(
            AuthorizationPolicies.DeleteEmployees,
            policy =>
            {
                policy.RequireRole(
                    AppRoles.SuperAdmin);
            });
    });

WebApplication app =
    builder.Build();

await DbSeeder.SeedAsync(
    app.Services);

app.UseMiddleware<
    ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors(
    ReactCorsPolicy);

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();