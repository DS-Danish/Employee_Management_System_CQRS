using MediatR;

namespace EmployeeManagement.Application.Departments.Commands.DeleteDepartment;

public sealed record DeleteDepartment(
    Guid Id)
    : IRequest<bool>;