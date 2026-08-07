using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Queries.GetMyLeaves;

public sealed record GetMyLeavesQuery
    : IRequest<IReadOnlyList<LeaveDto>>;