using MediatR;

namespace EmployeeManagement.Application.Projects.Commands.CompleteProject;

public sealed record CompleteProject(
    Guid Id)
    : IRequest<CompleteProjectResult>;

public enum CompleteProjectResult
{
    Completed,
    AlreadyCompleted,
    NotFound
}