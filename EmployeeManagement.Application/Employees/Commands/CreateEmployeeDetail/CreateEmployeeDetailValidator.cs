using FluentValidation;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.CreateEmployeeDetail;

public sealed class CreateEmployeeDetailValidator
    : AbstractValidator<CreateEmployeeDetail>
{
    public CreateEmployeeDetailValidator()
    {
        RuleFor(x => x.EmployeeId)
            .NotEmpty();

        RuleFor(x => x.Cnic)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .MaximumLength(30);

        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.UtcNow);

        RuleFor(x => x.Gender)
            .NotEmpty()
            .MaximumLength(20);
    }
}