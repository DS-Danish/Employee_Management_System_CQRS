using EmployeeManagement.Application.Leaves.Dtos;
using MediatR;

namespace EmployeeManagement.Application.Leaves.Queries.GetLeavePolicies;

public sealed record GetLeavePoliciesQuery
    : IRequest<IReadOnlyList<LeavePolicyDto>>;