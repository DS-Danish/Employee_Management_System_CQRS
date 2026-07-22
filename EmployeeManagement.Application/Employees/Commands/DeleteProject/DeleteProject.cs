using MediatR;

namespace EmployeeManagement.Application.Projects.Commands.DeleteProject;

public sealed record DeleteProject(
    Guid Id) : IRequest<bool>;