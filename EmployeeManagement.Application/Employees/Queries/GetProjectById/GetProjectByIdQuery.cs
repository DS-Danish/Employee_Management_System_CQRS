using EmployeeManagement.Application.Projects.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Projects.Queries.GetProjectById;

public sealed record GetProjectByIdQuery(
    Guid Id) : IRequest<ProjectDto?>;