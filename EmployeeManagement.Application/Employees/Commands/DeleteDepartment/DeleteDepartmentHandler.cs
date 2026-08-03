using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Commands.DeleteDepartment;

public sealed class DeleteDepartmentHandler
    : IRequestHandler<DeleteDepartment, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public DeleteDepartmentHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        DeleteDepartment request,
        CancellationToken cancellationToken)
    {
        Department? department =
            await _dbContext.Departments
                .FirstOrDefaultAsync(
                    currentDepartment =>
                        currentDepartment.Id == request.Id,
                    cancellationToken);

        if (department is null)
        {
            return false;
        }

        List<Employee> employees =
            await _dbContext.Employees
                .Where(
                    employee =>
                        employee.DepartmentId == request.Id)
                .ToListAsync(
                    cancellationToken);

        foreach (Employee employee in employees)
        {
            employee.AssignDepartment(null);
        }

        _dbContext.Departments.Remove(
            department);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}