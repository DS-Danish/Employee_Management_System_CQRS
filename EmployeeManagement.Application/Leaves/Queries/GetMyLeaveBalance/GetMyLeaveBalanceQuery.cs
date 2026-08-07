using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Queries.GetMyLeaveBalance;

public sealed record GetMyLeaveBalanceQuery(
    int Year)
    : IRequest<IReadOnlyList<LeaveBalanceDto>>;