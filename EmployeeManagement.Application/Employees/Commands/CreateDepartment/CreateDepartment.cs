using MediatR;

namespace EmployeeManagement.Application.Departments.Commands.CreateDepartment;

public sealed record CreateDepartment(
    string Name) : IRequest<Guid>;