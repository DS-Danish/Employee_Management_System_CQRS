using MediatR;

namespace EmployeeManagement.Application.Employees.Commands.DeleteEmployee;

public sealed record DeleteEmployee(
    Guid Id
) : IRequest<bool>;