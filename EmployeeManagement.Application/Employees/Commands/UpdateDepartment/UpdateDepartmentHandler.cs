using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Commands.UpdateDepartment;

public sealed class UpdateDepartmentHandler
    : IRequestHandler<UpdateDepartment, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdateDepartmentHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        UpdateDepartment request,
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

        department.Update(request.Name);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}