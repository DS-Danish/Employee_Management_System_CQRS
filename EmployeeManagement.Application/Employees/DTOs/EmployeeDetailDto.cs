namespace EmployeeManagement.Application.EmployeeDetails.DTOs;

public sealed record EmployeeDetailDto(
    Guid Id,
    Guid EmployeeId,
    string Cnic,
    string PhoneNumber,
    DateTime DateOfBirth,
    string Gender,
    DateTime CreatedAtUtc);