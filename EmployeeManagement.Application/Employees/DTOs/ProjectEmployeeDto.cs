namespace EmployeeManagement.Application.EmployeeProjects.DTOs;

public sealed record ProjectEmployeeDto(
    Guid EmployeeId,
    string FullName,
    string Email);