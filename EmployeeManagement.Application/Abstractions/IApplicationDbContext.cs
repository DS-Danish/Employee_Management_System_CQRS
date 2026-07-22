using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<Employee> Employees { get; }

    DbSet<Department> Departments { get; }

    DbSet<Project> Projects { get; }

    DbSet<EmployeeDetail> EmployeeDetails { get; }

    DbSet<EmployeeProject> EmployeeProjects { get; }

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}