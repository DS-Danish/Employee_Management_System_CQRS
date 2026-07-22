using MediatR;

namespace EmployeeManagement.Application.Projects.Commands.UpdateProject;

public sealed record UpdateProject(
    Guid Id,
    string Name,
    string? Description,
    DateTime StartDate,
    DateTime? EndDate) : IRequest<bool>;