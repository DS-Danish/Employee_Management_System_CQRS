using MediatR;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.DeleteEmployeeDetail;

public sealed record DeleteEmployeeDetail(
    Guid EmployeeId) : IRequest<bool>;