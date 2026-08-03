using EmployeeManagement.Application.Employees.DTOs;
using MediatR;

namespace EmployeeManagement.Application.Employees
    .Queries.GetMyEmployeeProfile;

public sealed record GetMyEmployeeProfileQuery(
    Guid EmployeeId)
    : IRequest<MyEmployeeProfileDto?>;