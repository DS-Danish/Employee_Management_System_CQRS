using EmployeeManagement.API.Middleware;
using EmployeeManagement.Application;
using EmployeeManagement.Infrastructure;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddControllers();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

WebApplication app = builder.Build();

// Apply migrations and seed database
using (IServiceScope scope = app.Services.CreateScope())
{
    ApplicationDbContext db =
        scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

// Global exception handling
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Redirect HTTP to HTTPS
app.UseHttpsRedirection();

// Map API controllers
app.MapControllers();

app.Run();