using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Projects.Commands.CompleteProject;

public sealed class CompleteProjectHandler
    : IRequestHandler<
        CompleteProject,
        CompleteProjectResult>
{
    private readonly IApplicationDbContext _dbContext;

    public CompleteProjectHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CompleteProjectResult> Handle(
        CompleteProject request,
        CancellationToken cancellationToken)
    {
        Project? project =
            await _dbContext.Projects
                .FirstOrDefaultAsync(
                    currentProject =>
                        currentProject.Id ==
                        request.Id,
                    cancellationToken);

        if (project is null)
        {
            return CompleteProjectResult.NotFound;
        }

        bool changed =
            project.MarkAsCompleted();

        if (!changed)
        {
            return CompleteProjectResult
                .AlreadyCompleted;
        }

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return CompleteProjectResult.Completed;
    }
}