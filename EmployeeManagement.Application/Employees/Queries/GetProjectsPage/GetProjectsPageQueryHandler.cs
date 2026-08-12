using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Projects.DTOs;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Projects.Queries.GetProjectsPage;

public sealed class GetProjectsPageQueryHandler
    : IRequestHandler<
        GetProjectsPageQuery,
        GetProjectsPageResult>
{
    private readonly IApplicationDbContext _dbContext;

    public GetProjectsPageQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GetProjectsPageResult> Handle(
        GetProjectsPageQuery request,
        CancellationToken cancellationToken)
    {
        int page =
            Math.Max(
                1,
                request.Page);

        int pageSize =
            Math.Clamp(
                request.PageSize,
                1,
                50);

        IQueryable<Project> allProjects =
            _dbContext
                .Projects
                .AsNoTracking();

        int totalCount =
            await allProjects.CountAsync(
                cancellationToken);

        int completedCount =
            await allProjects.CountAsync(
                project =>
                    project.Status ==
                    ProjectStatus.Completed,
                cancellationToken);

        int ongoingCount =
            totalCount -
            completedCount;

        IQueryable<Project> filteredProjects =
            allProjects;

        string search =
            request.Search?.Trim() ??
            string.Empty;

        if (!string.IsNullOrWhiteSpace(
                search))
        {
            filteredProjects =
                filteredProjects.Where(
                    project =>
                        project.Name.Contains(
                            search) ||
                        (
                            project.Description != null &&
                            project.Description.Contains(
                                search)
                        ));
        }

        int filteredCount =
            await filteredProjects.CountAsync(
                cancellationToken);

        int filteredCompletedCount =
            await filteredProjects.CountAsync(
                project =>
                    project.Status ==
                    ProjectStatus.Completed,
                cancellationToken);

        int filteredOngoingCount =
            filteredCount -
            filteredCompletedCount;

        string normalizedStatus =
            request.Status?
                .Trim()
                .ToLowerInvariant() ??
            "all";

        IQueryable<Project> pageQuery =
            normalizedStatus switch
            {
                "ongoing" =>
                    filteredProjects.Where(
                        project =>
                            project.Status !=
                            ProjectStatus.Completed),

                "completed" =>
                    filteredProjects.Where(
                        project =>
                            project.Status ==
                            ProjectStatus.Completed),

                _ =>
                    filteredProjects
            };

        List<ProjectDto> pageItems =
            await pageQuery
                .OrderBy(
                    project =>
                        project.Name)
                .Skip(
                    (page - 1) *
                    pageSize)
                .Take(
                    pageSize + 1)
                .Select(
                    project =>
                        new ProjectDto(
                            project.Id,
                            project.Name,
                            project.Description,
                            project.StartDate,
                            project.EndDate,
                            project.CreatedAtUtc,
                            project.Status ==
                            ProjectStatus.Completed
                                ? "Completed"
                                : "Active"))
                .ToListAsync(
                    cancellationToken);

        bool hasMore =
            pageItems.Count >
            pageSize;

        if (hasMore)
        {
            pageItems.RemoveAt(
                pageItems.Count - 1);
        }

        return new GetProjectsPageResult(
            pageItems,
            hasMore,
            totalCount,
            ongoingCount,
            completedCount,
            filteredCount,
            filteredOngoingCount,
            filteredCompletedCount);
    }
}