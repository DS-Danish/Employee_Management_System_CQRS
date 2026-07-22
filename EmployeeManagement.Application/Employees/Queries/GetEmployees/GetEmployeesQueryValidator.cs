using FluentValidation;


namespace EmployeeManagement.Application.Employees.Queries.GetEmployees;

public sealed class GetEmployeesQueryValidator
    : AbstractValidator<GetEmployeesQuery>
{
    public GetEmployeesQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100);
    }
}