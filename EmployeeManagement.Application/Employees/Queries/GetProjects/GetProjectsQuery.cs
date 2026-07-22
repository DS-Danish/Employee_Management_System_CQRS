using EmployeeManagement.Application.Projects.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Projects.Queries.GetProjects;

public sealed record GetProjectsQuery
    : IRequest<IReadOnlyList<ProjectDto>>;