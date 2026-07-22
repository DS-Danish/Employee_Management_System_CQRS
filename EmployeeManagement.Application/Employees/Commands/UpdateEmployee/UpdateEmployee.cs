using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.UpdateEmployee;

public sealed record UpdateEmployee(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string Street,
    string City,
    string Country,
    string PostalCode
) : IRequest<bool>;