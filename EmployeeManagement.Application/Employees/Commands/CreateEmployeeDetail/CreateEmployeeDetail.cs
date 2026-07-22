using MediatR;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.CreateEmployeeDetail;

public sealed record CreateEmployeeDetail(
    Guid EmployeeId,
    string Cnic,
    string PhoneNumber,
    DateTime DateOfBirth,
    string Gender) : IRequest<Guid>;