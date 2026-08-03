namespace EmployeeManagement.Application.Projects.DTOs;

public sealed record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    DateTime StartDate,
    DateTime? EndDate,
    DateTime CreatedAtUtc,
    string Status);