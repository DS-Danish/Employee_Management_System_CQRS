using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Projects.Commands.DeleteProject;

public sealed class DeleteProjectHandler
    : IRequestHandler<DeleteProject, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public DeleteProjectHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        DeleteProject request,
        CancellationToken cancellationToken)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (project is null)
        {
            return false;
        }

        _dbContext.Projects.Remove(project);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}