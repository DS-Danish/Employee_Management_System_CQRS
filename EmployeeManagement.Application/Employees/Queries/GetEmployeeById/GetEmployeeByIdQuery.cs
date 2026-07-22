using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeById;

public sealed record GetEmployeeByIdQuery(
    Guid Id)
    : IRequest<EmployeeDto?>;