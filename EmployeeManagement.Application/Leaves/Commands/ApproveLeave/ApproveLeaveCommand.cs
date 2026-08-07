using MediatR;

namespace EmployeeManagement.Application.Leaves.Commands.ApproveLeave;

public sealed record ApproveLeaveCommand(
    Guid LeaveRequestId,
    string? Comment
) : IRequest;