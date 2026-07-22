using EmployeeManagement.Application.Departments.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartments;

public sealed record GetDepartmentsQuery
    : IRequest<IReadOnlyList<DepartmentDto>>;