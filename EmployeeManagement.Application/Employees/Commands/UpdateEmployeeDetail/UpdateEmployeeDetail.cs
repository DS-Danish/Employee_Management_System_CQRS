using MediatR;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.UpdateEmployeeDetail;

public sealed record UpdateEmployeeDetail(
    Guid EmployeeId,
    string Cnic,
    string PhoneNumber,
    DateTime DateOfBirth,
    string Gender) : IRequest<bool>;