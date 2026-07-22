using EmployeeManagement.Application.EmployeeProjects.DTOs;
using MediatR;

namespace EmployeeManagement.Application.EmployeeProjects.Queries.GetEmployeeProjects;

public sealed record GetEmployeeProjectsQuery(
    Guid EmployeeId)
    : IRequest<IReadOnlyList<EmployeeProjectDto>>;