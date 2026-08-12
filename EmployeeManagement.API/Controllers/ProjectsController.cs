using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Projects.Commands.CompleteProject;
using EmployeeManagement.Application.Projects.Commands.CreateProject;
using EmployeeManagement.Application.Projects.Commands.DeleteProject;
using EmployeeManagement.Application.Projects.Commands.UpdateProject;
using EmployeeManagement.Application.Projects.DTOs;
using EmployeeManagement.Application.EmployeeProjects.DTOs;
using EmployeeManagement.Application.EmployeeProjects.Queries.GetProjectEmployees;
using EmployeeManagement.Application.Projects.Queries.GetProjectById;
using EmployeeManagement.Application.Projects.Queries.GetProjects;
using EmployeeManagement.Application.Projects.Queries.GetProjectsPage;
using EmployeeManagement.Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public sealed class ProjectsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public ProjectsController(
        ISender sender,
        IApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        _sender = sender;
        _dbContext = dbContext;
        _userManager = userManager;
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

    [HttpGet("paged")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin + "," +
            AppRoles.TeamLead + "," +
            AppRoles.Employee)]
    public async Task<ActionResult<
        GetProjectsPageResult>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest(
                new
                {
                    message =
                        "Page must be greater than zero."
                });
        }

        if (pageSize < 1 ||
            pageSize > 50)
        {
            return BadRequest(
                new
                {
                    message =
                        "Page size must be between 1 and 50."
                });
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            string normalizedStatus =
                status
                    .Trim()
                    .ToLowerInvariant();

            if (normalizedStatus != "all" &&
                normalizedStatus != "ongoing" &&
                normalizedStatus != "completed")
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Status must be all, ongoing or completed."
                    });
            }
        }

        GetProjectsPageResult result =
            await _sender.Send(
                new GetProjectsPageQuery(
                    page,
                    pageSize,
                    search,
                    status),
                cancellationToken);

        return Ok(result);
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
    
    [HttpGet("{id:guid}/employees")]
    [Authorize(
        Roles =
        AppRoles.SuperAdmin + "," +
        AppRoles.TeamLead)]
    public async Task<ActionResult<
        IReadOnlyList<ProjectEmployeeDto>>> GetEmployees(
        Guid id,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ProjectEmployeeDto> employees =
            await _sender.Send(
                new GetProjectEmployeesQuery(id),
                cancellationToken);

        return Ok(employees);
    }
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
            AppRoles.TeamLead + "," +
            AppRoles.Employee)]
    public async Task<IActionResult> Complete(
        Guid id,
        CancellationToken cancellationToken)
    {
        /*
         * Super Admin and Team Lead keep their existing
         * ability to complete projects.
         *
         * Employees may only complete projects that are
         * assigned to their own employee record.
         */
        if (User.IsInRole(AppRoles.Employee))
        {
            ApplicationUser? user =
                await _userManager.GetUserAsync(
                    User);

            if (user is null)
            {
                return Unauthorized(
                    new
                    {
                        message =
                            "Unable to identify the current user."
                    });
            }

            if (!user.EmployeeId.HasValue)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Your user account is not linked to an employee record."
                    });
            }

            bool isAssigned =
                await _dbContext.EmployeeProjects
                    .AsNoTracking()
                    .AnyAsync(
                        assignment =>
                            assignment.EmployeeId ==
                            user.EmployeeId.Value &&
                            assignment.ProjectId == id,
                        cancellationToken);

            if (!isAssigned)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "You can only complete projects assigned to you."
                    });
            }
        }

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