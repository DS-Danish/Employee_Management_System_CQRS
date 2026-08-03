using System.Security.Claims;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Employees.Commands.CreateEmployee;
using EmployeeManagement.Application.Employees.Commands.DeleteEmployee;
using EmployeeManagement.Application.Employees.Commands.UpdateEmployee;
using EmployeeManagement.Application.Employees.Commands.UpdateMyEmployeeProfile;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeById;
using EmployeeManagement.Application.Employees.Queries.GetEmployees;
using EmployeeManagement.Application.Employees.Queries.GetMyEmployeeProfile;
using EmployeeManagement.Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public sealed class EmployeesController : ControllerBase
{
    private readonly ISender _sender;

    private readonly UserManager<ApplicationUser>
        _userManager;

    public EmployeesController(
        ISender sender,
        UserManager<ApplicationUser> userManager)
    {
        _sender = sender;
        _userManager = userManager;
    }

    [HttpPost]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin)]
    public async Task<ActionResult<Guid>> Create(
        CreateEmployee command,
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
        Policy =
            AuthorizationPolicies.ViewEmployees)]
    public async Task<ActionResult<
        PagedResult<EmployeeListItemDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        PagedResult<EmployeeListItemDto> result =
            await _sender.Send(
                new GetEmployeesQuery(
                    search,
                    pageNumber,
                    pageSize),
                cancellationToken);

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize(
        Roles =
            AppRoles.Employee + "," +
            AppRoles.TeamLead)]
    public async Task<ActionResult<MyEmployeeProfileDto>>
        GetMyProfile(
            CancellationToken cancellationToken)
    {
        if (!TryGetEmployeeId(
                out Guid employeeId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "This account is not linked to an employee profile."
                });
        }

        MyEmployeeProfileDto? employee =
            await _sender.Send(
                new GetMyEmployeeProfileQuery(
                    employeeId),
                cancellationToken);

        if (employee is null)
        {
            return NotFound(
                new
                {
                    message =
                        "The linked employee profile could not be found."
                });
        }

        return Ok(employee);
    }

    [HttpPut("me")]
    [Authorize(
        Roles =
            AppRoles.Employee + "," +
            AppRoles.TeamLead)]
    public async Task<IActionResult> UpdateMyProfile(
        UpdateMyEmployeeProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetEmployeeId(
                out Guid employeeId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "This account is not linked to an employee profile."
                });
        }

        bool updated =
            await _sender.Send(
                new UpdateMyEmployeeProfileCommand(
                    employeeId,
                    request.FirstName,
                    request.LastName,
                    request.Street,
                    request.City,
                    request.Country,
                    request.PostalCode),
                cancellationToken);

        if (!updated)
        {
            return NotFound(
                new
                {
                    message =
                        "The linked employee profile could not be found."
                });
        }

        return NoContent();
    }

    [HttpGet("{id:guid}")]
    [Authorize(
        Policy =
            AuthorizationPolicies.ViewEmployees)]
    public async Task<ActionResult<EmployeeDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        EmployeeDto? employee =
            await _sender.Send(
                new GetEmployeeByIdQuery(id),
                cancellationToken);

        if (employee is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Employee not found."
                });
        }

        return Ok(employee);
    }

    [HttpPut("{id:guid}")]
    [Authorize(
        Policy =
            AuthorizationPolicies.ManageEmployees)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateEmployeeRequest request,
        CancellationToken cancellationToken)
    {
        var command =
            new UpdateEmployee(
                id,
                request.FirstName,
                request.LastName,
                request.Email,
                request.Street,
                request.City,
                request.Country,
                request.PostalCode,
                request.DepartmentId);

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
                        "Employee not found."
                });
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(
        Roles =
            AppRoles.SuperAdmin)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        EmployeeDto? employee =
            await _sender.Send(
                new GetEmployeeByIdQuery(id),
                cancellationToken);

        if (employee is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Employee not found."
                });
        }

        ApplicationUser? linkedUser =
            await _userManager.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.EmployeeId == id,
                    cancellationToken);

        if (linkedUser is not null)
        {
            IdentityResult userDeleteResult =
                await _userManager.DeleteAsync(
                    linkedUser);

            if (!userDeleteResult.Succeeded)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "The employee's linked user account could not be deleted.",

                        errors =
                            userDeleteResult.Errors
                                .Select(
                                    error =>
                                        error.Description)
                                .ToArray()
                    });
            }
        }

        bool deleted =
            await _sender.Send(
                new DeleteEmployee(id),
                cancellationToken);

        if (!deleted)
        {
            return BadRequest(
                new
                {
                    message =
                        "The employee could not be deleted."
                });
        }

        return NoContent();
    }

    private bool TryGetEmployeeId(
        out Guid employeeId)
    {
        string? employeeIdClaim =
            User.FindFirstValue(
                "employeeId");

        return Guid.TryParse(
            employeeIdClaim,
            out employeeId);
    }
}

public sealed record UpdateEmployeeRequest(
    string FirstName,
    string LastName,
    string Email,
    string Street,
    string City,
    string Country,
    string PostalCode,
    Guid? DepartmentId);

public sealed record UpdateMyEmployeeProfileRequest(
    string FirstName,
    string LastName,
    string Street,
    string City,
    string Country,
    string PostalCode);