using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using EmployeeManagement.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Persistence;

public sealed class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>,
      IApplicationDbContext
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

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<ApplicationUser>(
            entity =>
            {
                entity.Property(user => user.FullName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.HasIndex(user => user.EmployeeId)
                    .IsUnique()
                    .HasFilter("[EmployeeId] IS NOT NULL");

                entity.HasIndex(user => user.DepartmentId);
            });
    }
}