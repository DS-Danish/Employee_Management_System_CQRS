using FluentValidation;

namespace EmployeeManagement.Application.Leaves.Commands.ApplyLeave;

public sealed class ApplyLeaveCommandValidator
    : AbstractValidator<ApplyLeaveCommand>
{
    public ApplyLeaveCommandValidator()
    {
        RuleFor(
                command =>
                    command.LeaveType)
            .IsInEnum()
            .WithMessage(
                "A valid leave type is required.");

        RuleFor(
                command =>
                    command.StartDate)
            .NotEmpty()
            .WithMessage(
                "Start date is required.");

        RuleFor(
                command =>
                    command.EndDate)
            .NotEmpty()
            .WithMessage(
                "End date is required.");

        RuleFor(
                command =>
                    command.EndDate)
            .GreaterThanOrEqualTo(
                command =>
                    command.StartDate)
            .WithMessage(
                "End date cannot be before the start date.");

        RuleFor(
                command =>
                    command.Reason)
            .NotEmpty()
            .WithMessage(
                "Reason is required.")
            .MaximumLength(500)
            .WithMessage(
                "Reason cannot exceed 500 characters.");

        RuleFor(
                command =>
                    command)
            .Must(
                command =>
                    command.StartDate.Year ==
                    command.EndDate.Year)
            .WithMessage(
                "A leave request cannot span multiple calendar years.");
    }
}