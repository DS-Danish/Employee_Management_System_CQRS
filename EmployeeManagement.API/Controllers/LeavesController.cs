using EmployeeManagement.API.Contracts;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Leaves.Commands.ApplyLeave;
using EmployeeManagement.Application.Leaves.Commands.ApproveLeave;
using EmployeeManagement.Application.Leaves.Commands.RejectLeave;
using EmployeeManagement.Application.Leaves.Dtos;
using EmployeeManagement.Application.Leaves.Queries.GetAllLeaves;
using EmployeeManagement.Application.Leaves.Queries.GetMyLeaveBalance;
using EmployeeManagement.Application.Leaves.Queries.GetMyLeaves;
using EmployeeManagement.Application.Leaves.Queries.GetPendingLeaves;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/leaves")]
[Authorize]
public sealed class LeavesController
    : ControllerBase
{
    private readonly ISender _sender;

    public LeavesController(
        ISender sender)
    {
        _sender = sender;
    }

    // =========================================================
    // APPLY FOR LEAVE
    // Employee + Team Lead
    // =========================================================

    [HttpPost]
    [Authorize(
        Roles =
            $"{AppRoles.Employee},{AppRoles.TeamLead}")]
    [ProducesResponseType(
        typeof(Guid),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<Guid>> Apply(
        [FromBody] ApplyLeaveRequest request,
        CancellationToken cancellationToken)
    {
        Guid leaveRequestId =
            await _sender.Send(
                new ApplyLeaveCommand(
                    request.LeaveType,
                    request.StartDate,
                    request.EndDate,
                    request.Reason),
                cancellationToken);

        return Ok(
            leaveRequestId);
    }

    // =========================================================
    // MY LEAVE REQUESTS
    // =========================================================

    [HttpGet("my")]
    [Authorize(
        Roles =
            $"{AppRoles.Employee},{AppRoles.TeamLead}")]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeaveDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<LeaveDto>>> GetMyLeaves(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<LeaveDto> result =
            await _sender.Send(
                new GetMyLeavesQuery(),
                cancellationToken);

        return Ok(
            result);
    }

    // =========================================================
    // MY LEAVE BALANCE
    // =========================================================

    [HttpGet("my/balance")]
    [Authorize(
        Roles =
            $"{AppRoles.Employee},{AppRoles.TeamLead}")]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeaveBalanceDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<LeaveBalanceDto>>> GetMyBalance(
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        int selectedYear =
            year ??
            DateTime.UtcNow.Year;

        IReadOnlyList<LeaveBalanceDto> result =
            await _sender.Send(
                new GetMyLeaveBalanceQuery(
                    selectedYear),
                cancellationToken);

        return Ok(
            result);
    }

    // =========================================================
    // PENDING LEAVES
    //
    // Team Lead:
    // Only their employees
    //
    // Super Admin:
    // All pending leaves
    // =========================================================

    [HttpGet("pending")]
    [Authorize(
        Roles =
            $"{AppRoles.TeamLead},{AppRoles.SuperAdmin}")]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeaveDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<LeaveDto>>> GetPendingLeaves(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<LeaveDto> result =
            await _sender.Send(
                new GetPendingLeavesQuery(),
                cancellationToken);

        return Ok(
            result);
    }

    // =========================================================
    // APPROVE LEAVE
    // =========================================================

    [HttpPut("{id:guid}/approve")]
    [Authorize(
        Roles =
            $"{AppRoles.TeamLead},{AppRoles.SuperAdmin}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Approve(
        Guid id,
        [FromBody] ReviewLeaveRequest request,
        CancellationToken cancellationToken)
    {
        await _sender.Send(
            new ApproveLeaveCommand(
                id,
                request.Comment),
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // REJECT LEAVE
    // =========================================================

    [HttpPut("{id:guid}/reject")]
    [Authorize(
        Roles =
            $"{AppRoles.TeamLead},{AppRoles.SuperAdmin}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] ReviewLeaveRequest request,
        CancellationToken cancellationToken)
    {
        await _sender.Send(
            new RejectLeaveCommand(
                id,
                request.Comment ??
                string.Empty),
            cancellationToken);

        return NoContent();
    }

    // =========================================================
    // ALL LEAVES
    // Super Admin only
    // =========================================================

    [HttpGet("all")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin)]
    [ProducesResponseType(
        typeof(IReadOnlyList<LeaveDto>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<LeaveDto>>> GetAllLeaves(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<LeaveDto> result =
            await _sender.Send(
                new GetAllLeavesQuery(),
                cancellationToken);

        return Ok(
            result);
    }
}