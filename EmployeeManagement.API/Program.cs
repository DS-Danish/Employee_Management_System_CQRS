using EmployeeManagement.API.Middleware;
using EmployeeManagement.Application;
using EmployeeManagement.Infrastructure;
using EmployeeManagement.Infrastructure.Identity;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

WebApplicationBuilder builder =
    WebApplication.CreateBuilder(args);

const string ReactCorsPolicy =
    "ReactFrontend";

builder.Services.AddControllers();

builder.Services.AddApplication();

builder.Services.AddInfrastructure(
    builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        ReactCorsPolicy,
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

WebApplication app =
    builder.Build();

using (IServiceScope scope =
       app.Services.CreateScope())
{
    ApplicationDbContext databaseContext =
        scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

    string serverName =
        databaseContext.Database
            .GetDbConnection()
            .DataSource;

    string databaseName =
        databaseContext.Database
            .GetDbConnection()
            .Database;

    Console.WriteLine(
        "======================================");

    Console.WriteLine(
        $"SQL Server: {serverName}");

    Console.WriteLine(
        $"Database: {databaseName}");

    Console.WriteLine(
        "======================================");

    await databaseContext.Database.MigrateAsync();
}

await DbSeeder.SeedAsync(app.Services);

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors(ReactCorsPolicy);

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();