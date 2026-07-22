using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.EmployeeProjects.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeProjects.Queries.GetEmployeeProjects;

public sealed class GetEmployeeProjectsQueryHandler
    : IRequestHandler<
        GetEmployeeProjectsQuery,
        IReadOnlyList<EmployeeProjectDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetEmployeeProjectsQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<EmployeeProjectDto>> Handle(
        GetEmployeeProjectsQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.EmployeeProjects
            .AsNoTracking()
            .Where(x => x.EmployeeId == request.EmployeeId)
            .OrderBy(x => x.Project.Name)
            .Select(x => new EmployeeProjectDto(
                x.ProjectId,
                x.Project.Name,
                x.Project.Description,
                x.AssignedAtUtc))
            .ToListAsync(cancellationToken);
    }
}