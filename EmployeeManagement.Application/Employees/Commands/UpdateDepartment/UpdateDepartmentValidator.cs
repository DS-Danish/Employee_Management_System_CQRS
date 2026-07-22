using FluentValidation;

namespace EmployeeManagement.Application.Departments.Commands.UpdateDepartment;

public sealed class UpdateDepartmentValidator
    : AbstractValidator<UpdateDepartment>
{
    public UpdateDepartmentValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);
    }
}