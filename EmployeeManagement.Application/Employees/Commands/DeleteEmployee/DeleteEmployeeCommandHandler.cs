using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.DeleteEmployee;

public sealed class DeleteEmployeeCommandHandler
    : IRequestHandler<DeleteEmployee, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public DeleteEmployeeCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        DeleteEmployee request,
        CancellationToken cancellationToken)
    {
        var employee = await _dbContext.Employees
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (employee is null)
        {
            return false;
        }

        _dbContext.Employees.Remove(employee);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}