using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Projects.DTOs;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Projects.Queries.GetProjects;

public sealed class GetProjectsQueryHandler
    : IRequestHandler<
        GetProjectsQuery,
        IReadOnlyList<ProjectDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetProjectsQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ProjectDto>> Handle(
        GetProjectsQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Projects
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(
                x => new ProjectDto(
                    x.Id,
                    x.Name,
                    x.Description,
                    x.StartDate,
                    x.EndDate,
                    x.CreatedAtUtc,
                    x.Status == ProjectStatus.Completed
                        ? "Completed"
                        : "Active"))
            .ToListAsync(
                cancellationToken);
    }
}