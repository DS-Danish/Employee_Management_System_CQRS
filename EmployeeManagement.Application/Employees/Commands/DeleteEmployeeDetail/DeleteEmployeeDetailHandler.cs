using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.DeleteEmployee;

public sealed class DeleteEmployeeHandler
    : IRequestHandler<DeleteEmployee, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public DeleteEmployeeHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        DeleteEmployee request,
        CancellationToken cancellationToken)
    {
        Employee? employee =
            await _dbContext.Employees
                .FirstOrDefaultAsync(
                    currentEmployee =>
                        currentEmployee.Id ==
                        request.Id,
                    cancellationToken);

        if (employee is null)
        {
            return false;
        }

        List<EmployeeProject> assignments =
            await _dbContext.EmployeeProjects
                .Where(
                    assignment =>
                        assignment.EmployeeId ==
                        request.Id)
                .ToListAsync(
                    cancellationToken);

        if (assignments.Count > 0)
        {
            _dbContext.EmployeeProjects
                .RemoveRange(
                    assignments);
        }

        EmployeeDetail? detail =
            await _dbContext.EmployeeDetails
                .FirstOrDefaultAsync(
                    currentDetail =>
                        currentDetail.EmployeeId ==
                        request.Id,
                    cancellationToken);

        if (detail is not null)
        {
            _dbContext.EmployeeDetails
                .Remove(detail);
        }

        _dbContext.Employees.Remove(
            employee);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}