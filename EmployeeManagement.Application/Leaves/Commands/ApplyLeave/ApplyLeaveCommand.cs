using EmployeeManagement.Domain.Entities;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Commands.ApplyLeave;

public sealed record ApplyLeaveCommand(
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason)
    : IRequest<Guid>;