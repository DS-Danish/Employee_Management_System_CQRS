using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Departments.Commands.CreateDepartment;
using EmployeeManagement.Application.Departments.Commands.DeleteDepartment;
using EmployeeManagement.Application.Departments.Commands.UpdateDepartment;
using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Departments.Queries.GetDepartmentById;
using EmployeeManagement.Application.Departments.Queries.GetDepartments;
using EmployeeManagement.Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public sealed class DepartmentsController
    : ControllerBase
{
    private readonly ISender _sender;

    private readonly UserManager<ApplicationUser>
        _userManager;

    public DepartmentsController(
        ISender sender,
        UserManager<ApplicationUser> userManager)
    {
        _sender = sender;
        _userManager = userManager;
    }

    [HttpPost]
    [Authorize(
        Roles = AppRoles.SuperAdmin)]
    public async Task<ActionResult<Guid>> Create(
        CreateDepartment command,
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
    public async Task<ActionResult<
        IReadOnlyList<DepartmentDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<DepartmentDto> departments =
            await _sender.Send(
                new GetDepartmentsQuery(),
                cancellationToken);

        return Ok(departments);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DepartmentDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        DepartmentDto? department =
            await _sender.Send(
                new GetDepartmentByIdQuery(
                    id),
                cancellationToken);

        if (department is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Department not found."
                });
        }

        return Ok(department);
    }

    [HttpPut("{id:guid}")]
    [Authorize(
        Roles = AppRoles.SuperAdmin)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateDepartmentRequest request,
        CancellationToken cancellationToken)
    {
        var command =
            new UpdateDepartment(
                id,
                request.Name);

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
                        "Department not found."
                });
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(
        Roles = AppRoles.SuperAdmin)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        DepartmentDto? department =
            await _sender.Send(
                new GetDepartmentByIdQuery(
                    id),
                cancellationToken);

        if (department is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Department not found."
                });
        }

        List<ApplicationUser> linkedUsers =
            await _userManager.Users
                .Where(
                    user =>
                        user.DepartmentId == id)
                .ToListAsync(
                    cancellationToken);

        foreach (ApplicationUser user in linkedUsers)
        {
            user.DepartmentId = null;

            IdentityResult updateResult =
                await _userManager.UpdateAsync(
                    user);

            if (!updateResult.Succeeded)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "A linked user account could not be detached from the department.",

                        errors =
                            updateResult.Errors
                                .Select(
                                    error =>
                                        error.Description)
                                .ToArray()
                    });
            }
        }

        bool deleted =
            await _sender.Send(
                new DeleteDepartment(id),
                cancellationToken);

        if (!deleted)
        {
            return BadRequest(
                new
                {
                    message =
                        "The department could not be deleted."
                });
        }

        return NoContent();
    }
}

public sealed record UpdateDepartmentRequest(
    string Name);