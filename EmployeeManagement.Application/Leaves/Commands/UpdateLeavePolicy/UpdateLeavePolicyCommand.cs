using EmployeeManagement.Domain.Entities;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Commands.UpdateLeavePolicy;

public sealed record UpdateLeavePolicyCommand(
    LeaveType LeaveType,
    int AllowedDaysPerYear)
    : IRequest;