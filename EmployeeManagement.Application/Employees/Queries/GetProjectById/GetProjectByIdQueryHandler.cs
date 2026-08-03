using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Projects.DTOs;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Projects.Queries.GetProjectById;

public sealed class GetProjectByIdQueryHandler
    : IRequestHandler<
        GetProjectByIdQuery,
        ProjectDto?>
{
    private readonly IApplicationDbContext _dbContext;

    public GetProjectByIdQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ProjectDto?> Handle(
        GetProjectByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Projects
            .AsNoTracking()
            .Where(
                x =>
                    x.Id == request.Id)
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
            .SingleOrDefaultAsync(
                cancellationToken);
    }
}