using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Queries.GetLeavePolicies;

public sealed class GetLeavePoliciesQueryHandler
    : IRequestHandler<
        GetLeavePoliciesQuery,
        IReadOnlyList<LeavePolicyDto>>
{
    private readonly IApplicationDbContext
        _databaseContext;

    public GetLeavePoliciesQueryHandler(
        IApplicationDbContext databaseContext)
    {
        _databaseContext =
            databaseContext;
    }

    public async Task<IReadOnlyList<LeavePolicyDto>> Handle(
        GetLeavePoliciesQuery request,
        CancellationToken cancellationToken)
    {
        List<LeavePolicyDto> policies =
            await _databaseContext
                .LeavePolicies
                .AsNoTracking()
                .OrderBy(
                    policy =>
                        policy.LeaveType)
                .Select(
                    policy =>
                        new LeavePolicyDto(
                            policy.Id,
                            policy.LeaveType,
                            policy.AllowedDaysPerYear,
                            policy.IsUnlimited))
                .ToListAsync(
                    cancellationToken);

        return policies;
    }
}