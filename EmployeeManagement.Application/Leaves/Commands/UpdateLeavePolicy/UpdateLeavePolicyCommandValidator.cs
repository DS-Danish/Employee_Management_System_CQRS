using EmployeeManagement.Domain.Entities;
using FluentValidation;

namespace EmployeeManagement.Application.Leaves.Commands.UpdateLeavePolicy;

public sealed class UpdateLeavePolicyCommandValidator
    : AbstractValidator<UpdateLeavePolicyCommand>
{
    public UpdateLeavePolicyCommandValidator()
    {
        RuleFor(
                command =>
                    command.LeaveType)
            .IsInEnum()
            .WithMessage(
                "A valid leave type is required.");

        RuleFor(
                command =>
                    command.AllowedDaysPerYear)
            .GreaterThanOrEqualTo(0)
            .WithMessage(
                "Allowed leave days cannot be negative.");

        RuleFor(
                command =>
                    command.LeaveType)
            .NotEqual(
                LeaveType.Unpaid)
            .WithMessage(
                "Unpaid leave is unlimited and cannot have an annual limit.");
    }
}