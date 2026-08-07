using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetMyLeaves;

public sealed class GetMyLeavesQueryHandler
    : IRequestHandler<
        GetMyLeavesQuery,
        IReadOnlyList<LeaveDto>>
{
    private readonly IApplicationDbContext
        _databaseContext;

    private readonly ICurrentUserService
        _currentUser;

    public GetMyLeavesQueryHandler(
        IApplicationDbContext databaseContext,
        ICurrentUserService currentUser)
    {
        _databaseContext =
            databaseContext;

        _currentUser =
            currentUser;
    }

    public async Task<IReadOnlyList<LeaveDto>> Handle(
        GetMyLeavesQuery request,
        CancellationToken cancellationToken)
    {
        Guid employeeId =
            _currentUser.EmployeeId
            ?? throw new UnauthorizedAccessException(
                "The current user is not linked to an employee.");

        List<LeaveDto> leaves =
            await _databaseContext
                .LeaveRequests
                .AsNoTracking()
                .Where(
                    leave =>
                        leave.EmployeeId ==
                        employeeId)
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
                            leave.ReviewComment))
                .ToListAsync(
                    cancellationToken);

        return leaves;
    }
}