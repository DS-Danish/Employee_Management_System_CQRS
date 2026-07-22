namespace EmployeeManagement.Application.Employees.DTOs;

public sealed record EmployeeDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string Street,
    string City,
    string Country,
    string PostalCode,
    DateTime CreatedAtUtc);