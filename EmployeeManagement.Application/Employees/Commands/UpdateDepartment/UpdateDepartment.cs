using MediatR;

namespace EmployeeManagement.Application.Departments.Commands.UpdateDepartment;

public sealed record UpdateDepartment(
    Guid Id,
    string Name) : IRequest<bool>;