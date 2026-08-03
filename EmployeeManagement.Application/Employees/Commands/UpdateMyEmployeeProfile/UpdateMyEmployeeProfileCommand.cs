using MediatR;

namespace EmployeeManagement.Application.Employees
    .Commands.UpdateMyEmployeeProfile;

public sealed record UpdateMyEmployeeProfileCommand(
    Guid EmployeeId,
    string FirstName,
    string LastName,
    string Street,
    string City,
    string Country,
    string PostalCode)
    : IRequest<bool>;