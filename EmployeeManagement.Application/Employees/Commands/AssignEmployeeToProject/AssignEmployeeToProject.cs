using MediatR;

namespace EmployeeManagement.Application.EmployeeProjects.Commands.AssignEmployeeToProject;

public sealed record AssignEmployeeToProject(
    Guid EmployeeId,
    Guid ProjectId) : IRequest<bool>;