using EmployeeManagement.Application.EmployeeProjects.DTOs;
using MediatR;

namespace EmployeeManagement.Application.EmployeeProjects
    .Queries.GetProjectEmployees;

public sealed record GetProjectEmployeesQuery(
    Guid ProjectId)
    : IRequest<IReadOnlyList<ProjectEmployeeDto>>;