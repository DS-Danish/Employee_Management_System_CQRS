namespace EmployeeManagement.Application.Employees.DTOs;

public sealed record MyEmployeeProfileDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string Street,
    string City,
    string Country,
    string PostalCode,
    Guid? DepartmentId,
    string? DepartmentName,
    DateTime CreatedAtUtc);