using EmployeeManagement.API.Contracts;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Leaves.Commands.UpdateLeavePolicy;
using EmployeeManagement.Application.Leaves.Dtos;
using EmployeeManagement.Application.Leaves.Queries.GetLeavePolicies;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/leave-policies")]
[Authorize(
    Roles =
        AppRoles.SuperAdmin)]
public sealed class LeavePoliciesController
    : ControllerBase
{
    private readonly ISender _sender;

    public LeavePoliciesController(
        ISender sender)
    {
        _sender =
            sender;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeavePolicyDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<LeavePolicyDto>>> Get(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<LeavePolicyDto> policies =
            await _sender.Send(
                new GetLeavePoliciesQuery(),
                cancellationToken);

        return Ok(
            policies);
    }

    [HttpPut("{leaveType}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update(
        LeaveType leaveType,
        [FromBody] UpdateLeavePolicyRequest request,
        CancellationToken cancellationToken)
    {
        await _sender.Send(
            new UpdateLeavePolicyCommand(
                leaveType,
                request.AllowedDaysPerYear),
            cancellationToken);

        return NoContent();
    }
}