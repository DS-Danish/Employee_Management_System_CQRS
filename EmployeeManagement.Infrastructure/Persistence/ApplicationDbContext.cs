using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Persistence;

public sealed class ApplicationDbContext
    : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees =>
        Set<Employee>();

    public DbSet<Department> Departments =>
        Set<Department>();

    public DbSet<Project> Projects =>
        Set<Project>();

    public DbSet<EmployeeDetail> EmployeeDetails =>
        Set<EmployeeDetail>();

    public DbSet<EmployeeProject> EmployeeProjects =>
        Set<EmployeeProject>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);
    }
}