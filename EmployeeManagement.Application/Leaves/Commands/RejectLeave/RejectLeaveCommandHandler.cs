using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.RejectLeave;

public sealed class RejectLeaveCommandHandler
    : IRequestHandler<RejectLeaveCommand>
{
    private readonly IApplicationDbContext
        _databaseContext;

    private readonly ICurrentUserService
        _currentUser;

    public RejectLeaveCommandHandler(
        IApplicationDbContext databaseContext,
        ICurrentUserService currentUser)
    {
        _databaseContext =
            databaseContext;

        _currentUser =
            currentUser;
    }

    public async Task Handle(
        RejectLeaveCommand request,
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
                "Only pending leave requests can be rejected.");
        }

        /*
         * Super Admin can reject any pending
         * leave request.
         */
        bool isSuperAdmin =
            _currentUser.IsInRole(
                AppRoles.SuperAdmin);

        if (!isSuperAdmin)
        {
            /*
             * Otherwise the reviewer must be
             * a Team Lead.
             */
            if (!_currentUser.IsInRole(
                    AppRoles.TeamLead))
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to reject leave requests.");
            }

            Guid teamLeadEmployeeId =
                _currentUser.EmployeeId
                ?? throw new UnauthorizedAccessException(
                    "The Team Lead account is not linked to an employee.");

            /*
             * Team Lead cannot reject their
             * own application.
             */
            if (leaveRequest.EmployeeId ==
                teamLeadEmployeeId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot reject your own leave request.");
            }

            /*
             * Team Lead can only reject requests
             * belonging to employees assigned to them.
             */
            if (leaveRequest.Employee.TeamLeadId !=
                teamLeadEmployeeId)
            {
                throw new UnauthorizedAccessException(
                    "You can only reject leave requests from employees assigned to your team.");
            }
        }

        string reviewerUserId =
            _currentUser.UserId
            ?? throw new UnauthorizedAccessException(
                "The current user could not be identified.");

        leaveRequest.Reject(
            reviewerUserId,
            request.Comment.Trim());

        await _databaseContext
            .SaveChangesAsync(
                cancellationToken);
    }
}