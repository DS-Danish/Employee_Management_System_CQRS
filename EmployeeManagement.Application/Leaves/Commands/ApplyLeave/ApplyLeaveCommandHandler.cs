using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.ApplyLeave;

public sealed class ApplyLeaveCommandHandler
    : IRequestHandler<
        ApplyLeaveCommand,
        Guid>
{
    private readonly IApplicationDbContext
        _databaseContext;

    private readonly ICurrentUserService
        _currentUser;

    public ApplyLeaveCommandHandler(
        IApplicationDbContext databaseContext,
        ICurrentUserService currentUser)
    {
        _databaseContext =
            databaseContext;

        _currentUser =
            currentUser;
    }

    public async Task<Guid> Handle(
        ApplyLeaveCommand request,
        CancellationToken cancellationToken)
    {
        /*
         * EmployeeId comes from the authenticated
         * JWT rather than from the request body.
         */
        Guid employeeId =
            _currentUser.EmployeeId
            ?? throw new UnauthorizedAccessException(
                "The current user is not linked to an employee.");

        /*
         * Make sure the linked Employee still exists.
         */
        bool employeeExists =
            await _databaseContext
                .Employees
                .AsNoTracking()
                .AnyAsync(
                    employee =>
                        employee.Id ==
                        employeeId,
                    cancellationToken);

        if (!employeeExists)
        {
            throw new InvalidOperationException(
                "The employee associated with this account does not exist.");
        }

        /*
         * Currently every calendar day is considered
         * a leave day.
         *
         * Example:
         * 10 Aug - 12 Aug = 3 days.
         */
        int requestedDays =
            request.EndDate.DayNumber -
            request.StartDate.DayNumber +
            1;

        if (requestedDays <= 0)
        {
            throw new InvalidOperationException(
                "The leave duration must be at least one day.");
        }

        /*
         * Prevent overlapping pending or approved
         * leave requests.
         *
         * Rejected leaves do not block new requests.
         */
        bool hasOverlappingLeave =
            await _databaseContext
                .LeaveRequests
                .AsNoTracking()
                .AnyAsync(
                    leave =>
                        leave.EmployeeId ==
                        employeeId &&

                        (
                            leave.Status ==
                            LeaveStatus.Pending ||

                            leave.Status ==
                            LeaveStatus.Approved
                        ) &&

                        leave.StartDate <=
                        request.EndDate &&

                        leave.EndDate >=
                        request.StartDate,

                    cancellationToken);

        if (hasOverlappingLeave)
        {
            throw new InvalidOperationException(
                "You already have a pending or approved leave request for the selected dates.");
        }

        /*
         * Retrieve the policy for the requested
         * leave type.
         */
        LeavePolicy? policy =
            await _databaseContext
                .LeavePolicies
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    leavePolicy =>
                        leavePolicy.LeaveType ==
                        request.LeaveType,
                    cancellationToken);

        if (policy is null)
        {
            throw new InvalidOperationException(
                "No leave policy exists for the selected leave type.");
        }

        /*
         * Unpaid leave is unlimited.
         *
         * Casual, Annual and Sick leave must
         * respect their yearly limits.
         */
        if (!policy.IsUnlimited)
        {
            int year =
                request.StartDate.Year;

            DateOnly yearStart =
                new(
                    year,
                    1,
                    1);

            DateOnly yearEnd =
                new(
                    year,
                    12,
                    31);

            /*
             * Both Approved and Pending leave
             * reserve the employee's leave balance.
             *
             * Example:
             *
             * Limit       = 10
             * Approved    = 4
             * Pending     = 3
             *
             * Available   = 3
             *
             * This prevents an employee from creating
             * several pending applications that exceed
             * their annual allowance.
             */
            int reservedDays =
                await _databaseContext
                    .LeaveRequests
                    .AsNoTracking()
                    .Where(
                        leave =>
                            leave.EmployeeId ==
                            employeeId &&

                            leave.LeaveType ==
                            request.LeaveType &&

                            leave.StartDate >=
                            yearStart &&

                            leave.StartDate <=
                            yearEnd &&

                            (
                                leave.Status ==
                                LeaveStatus.Pending ||

                                leave.Status ==
                                LeaveStatus.Approved
                            ))
                    .SumAsync(
                        leave =>
                            (int?)
                            leave.NumberOfDays,
                        cancellationToken)
                ?? 0;

            int allowedDays =
                policy.AllowedDaysPerYear
                ?? throw new InvalidOperationException(
                    "The leave policy does not have an annual limit configured.");

            int availableDays =
                Math.Max(
                    0,
                    allowedDays -
                    reservedDays);

            if (requestedDays >
                availableDays)
            {
                throw new InvalidOperationException(
                    $"Insufficient {request.LeaveType} leave balance. " +
                    $"Available days: {availableDays}. " +
                    $"Requested days: {requestedDays}.");
            }
        }

        /*
         * New requests always start as Pending.
         * LeaveRequest constructor handles that
         * domain rule.
         */
        var leaveRequest =
            new LeaveRequest(
                employeeId,
                request.LeaveType,
                request.StartDate,
                request.EndDate,
                requestedDays,
                request.Reason.Trim());

        _databaseContext
            .LeaveRequests
            .Add(
                leaveRequest);

        await _databaseContext
            .SaveChangesAsync(
                cancellationToken);

        return leaveRequest.Id;
    }
}