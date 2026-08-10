using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.EmployeeProjects.Commands.AssignEmployeeToProject;
using EmployeeManagement.Application.EmployeeProjects.Commands.RemoveEmployeeFromProject;
using EmployeeManagement.Application.EmployeeProjects.DTOs;
using EmployeeManagement.Application.EmployeeProjects.Queries.GetEmployeeProjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/employees/{employeeId:guid}/projects")]
[Authorize]
public sealed class EmployeeProjectsController
    : ControllerBase
{
    private readonly ISender _sender;

    public EmployeeProjectsController(
        ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("{projectId:guid}")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead)]
    public async Task<IActionResult> Assign(
        Guid employeeId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        bool assigned =
            await _sender.Send(
                new AssignEmployeeToProject(
                    employeeId,
                    projectId),
                cancellationToken);

        if (!assigned)
        {
            return BadRequest(
                new
                {
                    message =
                        "The employee or project was not found, or the assignment already exists."
                });
        }

        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<
        IReadOnlyList<EmployeeProjectDto>>> GetAll(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<EmployeeProjectDto> projects =
            await _sender.Send(
                new GetEmployeeProjectsQuery(
                    employeeId),
                cancellationToken);

        return Ok(projects);
    }

    [HttpDelete("{projectId:guid}")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead)]
    public async Task<IActionResult> Remove(
        Guid employeeId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        bool removed =
            await _sender.Send(
                new RemoveEmployeeFromProject(
                    employeeId,
                    projectId),
                cancellationToken);

        if (!removed)
        {
            return NotFound(
                new
                {
                    message =
                        "Employee-project assignment not found."
                });
        }

        return NoContent();
    }
}