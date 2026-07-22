using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeProjects.Commands.RemoveEmployeeFromProject;

public sealed class RemoveEmployeeFromProjectHandler
    : IRequestHandler<RemoveEmployeeFromProject, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public RemoveEmployeeFromProjectHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        RemoveEmployeeFromProject request,
        CancellationToken cancellationToken)
    {
        var assignment = await _dbContext.EmployeeProjects
            .FirstOrDefaultAsync(
                x =>
                    x.EmployeeId == request.EmployeeId &&
                    x.ProjectId == request.ProjectId,
                cancellationToken);

        if (assignment is null)
        {
            return false;
        }

        _dbContext.EmployeeProjects.Remove(assignment);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}