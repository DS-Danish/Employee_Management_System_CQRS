using EmployeeManagement.Application.Abstractions;
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
        var department = await _dbContext.Departments
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (department is null)
        {
            return false;
        }

        _dbContext.Departments.Remove(department);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}