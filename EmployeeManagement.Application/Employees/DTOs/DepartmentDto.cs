namespace EmployeeManagement.Application.Departments.DTOs;

public sealed record DepartmentDto(
    Guid Id,
    string Name,
    DateTime CreatedAtUtc);