namespace EmployeeManagement.Application.Employees.DTOs;

public sealed record EmployeeListItemDto(
    Guid Id,
    string FullName,
    string Email,
    string City);