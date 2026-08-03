using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Projects.Commands.CompleteProject;
using EmployeeManagement.Application.Projects.Commands.CreateProject;
using EmployeeManagement.Application.Projects.Commands.DeleteProject;
using EmployeeManagement.Application.Projects.Commands.UpdateProject;
using EmployeeManagement.Application.Projects.DTOs;
using EmployeeManagement.Application.Projects.Queries.GetProjectById;
using EmployeeManagement.Application.Projects.Queries.GetProjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public sealed class ProjectsController : ControllerBase
{
    private readonly ISender _sender;

    public ProjectsController(
        ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead)]
    public async Task<ActionResult<Guid>> Create(
        CreateProject command,
        CancellationToken cancellationToken)
    {
        Guid id =
            await _sender.Send(
                command,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id
            },
            id);
    }

    [HttpGet]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead + "," +
            AppRoles.Employee)]
    public async Task<ActionResult<
        IReadOnlyList<ProjectDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ProjectDto> projects =
            await _sender.Send(
                new GetProjectsQuery(),
                cancellationToken);

        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead + "," +
            AppRoles.Employee)]
    public async Task<ActionResult<ProjectDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        ProjectDto? project =
            await _sender.Send(
                new GetProjectByIdQuery(id),
                cancellationToken);

        if (project is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Project not found."
                });
        }

        return Ok(project);
    }

    [HttpPut("{id:guid}")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var command =
            new UpdateProject(
                id,
                request.Name,
                request.Description,
                request.StartDate,
                request.EndDate);

        bool updated =
            await _sender.Send(
                command,
                cancellationToken);

        if (!updated)
        {
            return NotFound(
                new
                {
                    message =
                        "Project not found."
                });
        }

        return NoContent();
    }

    [HttpPut("{id:guid}/complete")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead)]
    public async Task<IActionResult> Complete(
        Guid id,
        CancellationToken cancellationToken)
    {
        CompleteProjectResult result =
            await _sender.Send(
                new CompleteProject(id),
                cancellationToken);

        return result switch
        {
            CompleteProjectResult.Completed =>
                NoContent(),

            CompleteProjectResult.AlreadyCompleted =>
                Conflict(
                    new
                    {
                        message =
                            "The project is already completed."
                    }),

            CompleteProjectResult.NotFound =>
                NotFound(
                    new
                    {
                        message =
                            "Project not found."
                    }),

            _ =>
                StatusCode(
                    StatusCodes
                        .Status500InternalServerError)
        };
    }

    [HttpDelete("{id:guid}")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        bool deleted =
            await _sender.Send(
                new DeleteProject(id),
                cancellationToken);

        if (!deleted)
        {
            return NotFound(
                new
                {
                    message =
                        "Project not found."
                });
        }

        return NoContent();
    }
}

public sealed record UpdateProjectRequest(
    string Name,
    string? Description,
    DateTime StartDate,
    DateTime? EndDate);