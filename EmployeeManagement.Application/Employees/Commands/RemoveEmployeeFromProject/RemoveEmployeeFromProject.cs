using MediatR;

namespace EmployeeManagement.Application.EmployeeProjects.Commands.RemoveEmployeeFromProject;

public sealed record RemoveEmployeeFromProject(
    Guid EmployeeId,
    Guid ProjectId) : IRequest<bool>;