using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Leaves.Dtos;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetPendingLeaves;

public sealed class GetPendingLeavesQueryHandler
    : IRequestHandler<
        GetPendingLeavesQuery,
        IReadOnlyList<LeaveDto>>
{
    private readonly IApplicationDbContext
        _databaseContext;

    private readonly ICurrentUserService
        _currentUser;

    public GetPendingLeavesQueryHandler(
        IApplicationDbContext databaseContext,
        ICurrentUserService currentUser)
    {
        _databaseContext =
            databaseContext;

        _currentUser =
            currentUser;
    }

    public async Task<IReadOnlyList<LeaveDto>> Handle(
        GetPendingLeavesQuery request,
        CancellationToken cancellationToken)
    {
        IQueryable<LeaveRequest> query =
            _databaseContext
                .LeaveRequests
                .AsNoTracking()
                .Where(
                    leave =>
                        leave.Status ==
                        LeaveStatus.Pending);

        /*
         * Super Admin can see every pending
         * leave request.
         */
        if (_currentUser.IsInRole(
                AppRoles.SuperAdmin))
        {
            return await ProjectToDto(query)
                .ToListAsync(
                    cancellationToken);
        }

        /*
         * Only Team Leads can reach the
         * team-leave workflow.
         */
        if (!_currentUser.IsInRole(
                AppRoles.TeamLead))
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to view pending team leave requests.");
        }

        Guid teamLeadEmployeeId =
            _currentUser.EmployeeId
            ?? throw new UnauthorizedAccessException(
                "The Team Lead account is not linked to an employee.");

        /*
         * A Team Lead sees only employees whose
         * TeamLeadId points to their Employee.Id.
         *
         * This automatically excludes the
         * Team Lead's own leave request.
         */
        query =
            query.Where(
                leave =>
                    leave.Employee.TeamLeadId ==
                    teamLeadEmployeeId);

        return await ProjectToDto(query)
            .ToListAsync(
                cancellationToken);
    }

    private static IQueryable<LeaveDto> ProjectToDto(
        IQueryable<LeaveRequest> query)
    {
        return query
            .OrderByDescending(
                leave =>
                    leave.AppliedAtUtc)
            .Select(
                leave =>
                    new LeaveDto(
                        leave.Id,
                        leave.EmployeeId,

                        leave.Employee.FirstName +
                        " " +
                        leave.Employee.LastName,

                        leave.LeaveType,
                        leave.StartDate,
                        leave.EndDate,
                        leave.NumberOfDays,
                        leave.Reason,
                        leave.Status,
                        leave.AppliedAtUtc,
                        leave.ReviewedByUserId,
                        leave.ReviewedAtUtc,
                        leave.ReviewComment));
    }
}