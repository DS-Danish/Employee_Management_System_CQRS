using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Queries.GetPendingLeaves;

public sealed record GetPendingLeavesQuery
    : IRequest<IReadOnlyList<LeaveDto>>;