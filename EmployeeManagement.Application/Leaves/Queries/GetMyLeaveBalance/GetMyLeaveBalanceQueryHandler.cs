using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Leaves.Dtos;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetMyLeaveBalance;

public sealed class GetMyLeaveBalanceQueryHandler
    : IRequestHandler<
        GetMyLeaveBalanceQuery,
        IReadOnlyList<LeaveBalanceDto>>
{
    private readonly IApplicationDbContext
        _databaseContext;

    private readonly ICurrentUserService
        _currentUser;

    public GetMyLeaveBalanceQueryHandler(
        IApplicationDbContext databaseContext,
        ICurrentUserService currentUser)
    {
        _databaseContext =
            databaseContext;

        _currentUser =
            currentUser;
    }

    public async Task<IReadOnlyList<LeaveBalanceDto>> Handle(
        GetMyLeaveBalanceQuery request,
        CancellationToken cancellationToken)
    {
        Guid employeeId =
            _currentUser.EmployeeId
            ?? throw new UnauthorizedAccessException(
                "The current user is not linked to an employee.");

        if (request.Year < 2000 ||
            request.Year > 2100)
        {
            throw new ArgumentOutOfRangeException(
                nameof(request.Year),
                "The selected year is invalid.");
        }

        DateOnly yearStart =
            new(
                request.Year,
                1,
                1);

        DateOnly yearEnd =
            new(
                request.Year,
                12,
                31);

        /*
         * Load all leave policies.
         *
         * Expected:
         * Casual
         * Annual
         * Sick
         * Unpaid
         */
        List<LeavePolicy> policies =
            await _databaseContext
                .LeavePolicies
                .AsNoTracking()
                .OrderBy(
                    policy =>
                        policy.LeaveType)
                .ToListAsync(
                    cancellationToken);

        /*
         * Only Approved and Pending requests matter
         * when calculating the current balance.
         *
         * Rejected leave does not consume/reserve
         * any leave.
         */
        var leaveRequests =
            await _databaseContext
                .LeaveRequests
                .AsNoTracking()
                .Where(
                    leave =>
                        leave.EmployeeId ==
                        employeeId &&

                        leave.StartDate >=
                        yearStart &&

                        leave.StartDate <=
                        yearEnd &&

                        (
                            leave.Status ==
                            LeaveStatus.Approved ||

                            leave.Status ==
                            LeaveStatus.Pending
                        ))
                .Select(
                    leave =>
                        new
                        {
                            leave.LeaveType,
                            leave.NumberOfDays,
                            leave.Status
                        })
                .ToListAsync(
                    cancellationToken);

        var balances =
            new List<LeaveBalanceDto>();

        foreach (LeavePolicy policy in policies)
        {
            int approvedDays =
                leaveRequests
                    .Where(
                        leave =>
                            leave.LeaveType ==
                            policy.LeaveType &&

                            leave.Status ==
                            LeaveStatus.Approved)
                    .Sum(
                        leave =>
                            leave.NumberOfDays);

            int pendingDays =
                leaveRequests
                    .Where(
                        leave =>
                            leave.LeaveType ==
                            policy.LeaveType &&

                            leave.Status ==
                            LeaveStatus.Pending)
                    .Sum(
                        leave =>
                            leave.NumberOfDays);

            /*
             * Unpaid leave does not have an
             * annual limit.
             */
            if (policy.IsUnlimited)
            {
                balances.Add(
                    new LeaveBalanceDto(
                        policy.LeaveType,
                        null,
                        approvedDays,
                        pendingDays,
                        null,
                        null,
                        true));

                continue;
            }

            int allocatedDays =
                policy.AllowedDaysPerYear
                ?? 0;

            /*
             * Remaining is based on approved
             * leave only.
             */
            int remainingDays =
                Math.Max(
                    0,
                    allocatedDays -
                    approvedDays);

            /*
             * AvailableToApply also considers
             * pending applications because those
             * days have already been reserved.
             */
            int availableToApplyDays =
                Math.Max(
                    0,
                    allocatedDays -
                    approvedDays -
                    pendingDays);

            balances.Add(
                new LeaveBalanceDto(
                    policy.LeaveType,
                    allocatedDays,
                    approvedDays,
                    pendingDays,
                    remainingDays,
                    availableToApplyDays,
                    false));
        }

        return balances;
    }
}