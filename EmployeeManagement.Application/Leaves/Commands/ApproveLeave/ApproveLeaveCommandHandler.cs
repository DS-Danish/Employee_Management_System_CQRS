using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.ApproveLeave;

public sealed class ApproveLeaveCommandHandler
    : IRequestHandler<ApproveLeaveCommand>
{
    private readonly IApplicationDbContext
        _databaseContext;

    private readonly ICurrentUserService
        _currentUser;

    public ApproveLeaveCommandHandler(
        IApplicationDbContext databaseContext,
        ICurrentUserService currentUser)
    {
        _databaseContext =
            databaseContext;

        _currentUser =
            currentUser;
    }

    public async Task Handle(
        ApproveLeaveCommand request,
        CancellationToken cancellationToken)
    {
        LeaveRequest leaveRequest =
            await _databaseContext
                .LeaveRequests
                .Include(
                    leave =>
                        leave.Employee)
                .SingleOrDefaultAsync(
                    leave =>
                        leave.Id ==
                        request.LeaveRequestId,
                    cancellationToken)
            ?? throw new KeyNotFoundException(
                "The leave request was not found.");

        if (leaveRequest.Status !=
            LeaveStatus.Pending)
        {
            throw new InvalidOperationException(
                "Only pending leave requests can be approved.");
        }

        /*
         * Super Admin can approve any pending
         * leave request.
         *
         * This includes Team Lead leave requests.
         */
        bool isSuperAdmin =
            _currentUser.IsInRole(
                AppRoles.SuperAdmin);

        if (!isSuperAdmin)
        {
            /*
             * Otherwise, the reviewer must be
             * a Team Lead.
             */
            if (!_currentUser.IsInRole(
                    AppRoles.TeamLead))
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to approve leave requests.");
            }

            Guid teamLeadEmployeeId =
                _currentUser.EmployeeId
                ?? throw new UnauthorizedAccessException(
                    "The Team Lead account is not linked to an employee.");

            /*
             * Nobody can approve their own leave.
             */
            if (leaveRequest.EmployeeId ==
                teamLeadEmployeeId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot approve your own leave request.");
            }

            /*
             * A Team Lead may only approve leave
             * for their direct employees.
             */
            if (leaveRequest.Employee.TeamLeadId !=
                teamLeadEmployeeId)
            {
                throw new UnauthorizedAccessException(
                    "You can only approve leave requests from employees assigned to your team.");
            }
        }

        string reviewerUserId =
            _currentUser.UserId
            ?? throw new UnauthorizedAccessException(
                "The current user could not be identified.");

        leaveRequest.Approve(
            reviewerUserId,
            NormalizeOptionalComment(
                request.Comment));

        await _databaseContext
            .SaveChangesAsync(
                cancellationToken);
    }

    private static string? NormalizeOptionalComment(
        string? comment)
    {
        return string.IsNullOrWhiteSpace(
            comment)
                ? null
                : comment.Trim();
    }
}