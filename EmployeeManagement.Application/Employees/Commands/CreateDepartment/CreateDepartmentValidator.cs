using FluentValidation;

namespace EmployeeManagement.Application.Departments.Commands.CreateDepartment;

public sealed class CreateDepartmentValidator
    : AbstractValidator<CreateDepartment>
{
    public CreateDepartmentValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);
    }
}