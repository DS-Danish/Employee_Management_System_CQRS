using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployees;

public sealed record GetEmployeesQuery(
    string? Search,
    int PageNumber = 1,
    int PageSize = 10)
    : IRequest<PagedResult<EmployeeListItemDto>>;