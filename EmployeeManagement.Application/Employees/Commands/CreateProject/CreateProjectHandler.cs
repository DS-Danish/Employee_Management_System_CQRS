using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;

namespace EmployeeManagement.Application.Projects.Commands.CreateProject;

public sealed class CreateProjectHandler
    : IRequestHandler<CreateProject, Guid>
{
    private readonly IApplicationDbContext _dbContext;

    public CreateProjectHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(
        CreateProject request,
        CancellationToken cancellationToken)
    {
        var project = new Project(
            request.Name,
            request.Description,
            request.StartDate,
            request.EndDate);

        await _dbContext.Projects.AddAsync(
            project,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return project.Id;
    }
}