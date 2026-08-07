using MediatR;

namespace EmployeeManagement.Application.Leaves.Commands.RejectLeave;

public sealed record RejectLeaveCommand(
    Guid LeaveRequestId,
    string Comment)
    : IRequest;