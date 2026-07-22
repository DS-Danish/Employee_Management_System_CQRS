using EmployeeManagement.Application.Departments.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartmentById;

public sealed record GetDepartmentByIdQuery(Guid Id)
    : IRequest<DepartmentDto?>;