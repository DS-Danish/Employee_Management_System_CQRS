using FluentValidation;

namespace EmployeeManagement.Application.Leaves.Commands.RejectLeave;

public sealed class RejectLeaveCommandValidator
    : AbstractValidator<RejectLeaveCommand>
{
    public RejectLeaveCommandValidator()
    {
        RuleFor(
                command =>
                    command.LeaveRequestId)
            .NotEmpty()
            .WithMessage(
                "Leave request ID is required.");

        RuleFor(
                command =>
                    command.Comment)
            .NotEmpty()
            .WithMessage(
                "A reason is required when rejecting a leave request.")
            .MaximumLength(500)
            .WithMessage(
                "The rejection comment cannot exceed 500 characters.");
    }
}