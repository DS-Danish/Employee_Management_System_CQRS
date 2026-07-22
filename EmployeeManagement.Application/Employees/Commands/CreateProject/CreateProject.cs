using MediatR;

namespace EmployeeManagement.Application.Projects.Commands.CreateProject;

public sealed record CreateProject(
    string Name,
    string? Description,
    DateTime StartDate,
    DateTime? EndDate) : IRequest<Guid>;