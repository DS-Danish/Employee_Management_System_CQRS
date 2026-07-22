namespace EmployeeManagement.Application.EmployeeProjects.DTOs;

public sealed record EmployeeProjectDto(
    Guid ProjectId,
    string ProjectName,
    string? Description,
    DateTime AssignedAtUtc);