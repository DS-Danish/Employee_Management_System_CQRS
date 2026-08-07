using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Queries.GetAllLeaves;

public sealed record GetAllLeavesQuery
    : IRequest<IReadOnlyList<LeaveDto>>;