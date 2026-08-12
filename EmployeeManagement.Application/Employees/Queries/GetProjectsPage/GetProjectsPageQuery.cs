using EmployeeManagement.Application.Projects.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Projects.Queries.GetProjectsPage;

public sealed record GetProjectsPageQuery(
    int Page,
    int PageSize,
    string? Search,
    string? Status)
    : IRequest<GetProjectsPageResult>;

public sealed record GetProjectsPageResult(
    IReadOnlyList<ProjectDto> Items,
    bool HasMore,
    int TotalCount,
    int OngoingCount,
    int CompletedCount,
    int FilteredCount,
    int FilteredOngoingCount,
    int FilteredCompletedCount);