using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Projects.Commands.UpdateProject;

public sealed class UpdateProjectHandler
    : IRequestHandler<UpdateProject, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdateProjectHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        UpdateProject request,
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

        project.Update(
            request.Name,
            request.Description,
            request.StartDate,
            request.EndDate);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}