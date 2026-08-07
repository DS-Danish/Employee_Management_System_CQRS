using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Leaves.Commands.UpdateLeavePolicy;

public sealed class UpdateLeavePolicyCommandHandler
    : IRequestHandler<UpdateLeavePolicyCommand>
{
    private readonly IApplicationDbContext
        _databaseContext;

    public UpdateLeavePolicyCommandHandler(
        IApplicationDbContext databaseContext)
    {
        _databaseContext =
            databaseContext;
    }

    public async Task Handle(
        UpdateLeavePolicyCommand request,
        CancellationToken cancellationToken)
    {
        LeavePolicy policy =
            await _databaseContext
                .LeavePolicies
                .SingleOrDefaultAsync(
                    leavePolicy =>
                        leavePolicy.LeaveType ==
                        request.LeaveType,
                    cancellationToken)
            ?? throw new KeyNotFoundException(
                "The leave policy was not found.");

        if (policy.IsUnlimited)
        {
            throw new InvalidOperationException(
                "Unlimited leave policies cannot have an annual limit.");
        }

        policy.UpdateAllowedDays(
            request.AllowedDaysPerYear);

        await _databaseContext
            .SaveChangesAsync(
                cancellationToken);
    }
}