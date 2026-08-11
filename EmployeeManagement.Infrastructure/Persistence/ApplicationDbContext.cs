using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using EmployeeManagement.Infrastructure.Identity;

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Persistence;

public class ApplicationDbContext
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

    public DbSet<Permission> Permissions =>
        Set<Permission>();

    public DbSet<RolePermission> RolePermissions =>
        Set<RolePermission>();

    public DbSet<LeaveRequest> LeaveRequests =>
        Set<LeaveRequest>();

    public DbSet<LeavePolicy> LeavePolicies =>
        Set<LeavePolicy>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<ApplicationUser>(
            entity =>
            {
                entity.Property(
                        user => user.FullName)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.HasIndex(
                        user => user.EmployeeId)
                    .IsUnique()
                    .HasFilter(
                        "[EmployeeId] IS NOT NULL");

                entity.HasOne<Employee>()
                    .WithOne()
                    .HasForeignKey<ApplicationUser>(
                        user => user.EmployeeId)
                    .OnDelete(
                        DeleteBehavior.Restrict);

                entity.HasOne<Department>()
                    .WithMany()
                    .HasForeignKey(
                        user => user.DepartmentId)
                    .OnDelete(
                        DeleteBehavior.Restrict);
            });
    }
}