using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployee;

public sealed record CreateEmployee(
    string FirstName,
    string LastName,
    string Email,
    string Street,
    string City,
    string Country,
    string PostalCode
) : IRequest<Guid>;