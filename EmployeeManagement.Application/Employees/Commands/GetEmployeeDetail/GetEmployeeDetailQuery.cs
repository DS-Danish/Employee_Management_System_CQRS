using EmployeeManagement.Application.EmployeeDetails.DTOs;
using MediatR;

namespace EmployeeManagement.Application.EmployeeDetails.Queries.GetEmployeeDetail;

public sealed record GetEmployeeDetailQuery(
    Guid EmployeeId) : IRequest<EmployeeDetailDto?>;