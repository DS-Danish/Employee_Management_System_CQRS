using EmployeeManagement.Application.Authentication;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Domain.Entities;
using EmployeeManagement.Infrastructure.Identity;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser>
        _userManager;

    private readonly ApplicationDbContext
        _databaseContext;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext databaseContext)
    {
        _userManager = userManager;
        _databaseContext = databaseContext;
    }

    [HttpPost("register")]
    [ProducesResponseType(
        typeof(RegisterResponse),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RegisterResponse>>
        Register(
            [FromBody] RegisterRequest request)
    {
        string role =
            NormalizeRole(request.Role);

        if (!AppRoles.All.Contains(role))
        {
            return BadRequest(new
            {
                message =
                    "The selected role is invalid."
            });
        }

        string normalizedEmail =
            request.Email
                .Trim()
                .ToLowerInvariant();

        ApplicationUser? existingUser =
            await _userManager.FindByEmailAsync(
                normalizedEmail);

        if (existingUser is not null)
        {
            return BadRequest(new
            {
                message =
                    "A user with this email already exists."
            });
        }

        string? validationError =
            await ValidateRoleDataAsync(
                role,
                request.DepartmentId,
                request.EmployeeId);

        if (validationError is not null)
        {
            return BadRequest(new
            {
                message = validationError
            });
        }

        var user = new ApplicationUser
        {
            FullName =
                request.FullName.Trim(),

            Email =
                normalizedEmail,

            UserName =
                normalizedEmail,

            EmailConfirmed =
                true,

            DepartmentId =
                role == AppRoles.SuperAdmin
                    ? null
                    : request.DepartmentId,

            EmployeeId =
                role == AppRoles.Employee
                    ? request.EmployeeId
                    : null
        };

        IdentityResult createResult =
            await _userManager.CreateAsync(
                user,
                request.Password);

        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                message =
                    "Account creation failed.",

                errors =
                    createResult.Errors.Select(
                        error =>
                            error.Description)
            });
        }

        IdentityResult roleResult =
            await _userManager.AddToRoleAsync(
                user,
                role);

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);

            return BadRequest(new
            {
                message =
                    "Account role could not be assigned.",

                errors =
                    roleResult.Errors.Select(
                        error =>
                            error.Description)
            });
        }

        var response = new RegisterResponse
        {
            UserId =
                user.Id,

            FullName =
                user.FullName,

            Email =
                user.Email!,

            Role =
                role,

            DepartmentId =
                user.DepartmentId,

            EmployeeId =
                user.EmployeeId
        };

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }

    private async Task<string?>
        ValidateRoleDataAsync(
            string role,
            Guid? departmentId,
            Guid? employeeId)
    {
        if (role == AppRoles.SuperAdmin)
        {
            return null;
        }

        if (departmentId is null)
        {
            return "Department is required.";
        }

        bool departmentExists =
            await _databaseContext.Departments
                .AnyAsync(
                    department =>
                        department.Id ==
                        departmentId.Value);

        if (!departmentExists)
        {
            return
                "The selected department does not exist.";
        }

        if (role != AppRoles.Employee)
        {
            return null;
        }

        if (employeeId is null)
        {
            return "Employee ID is required.";
        }

        Employee? employee =
            await _databaseContext.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    currentEmployee =>
                        currentEmployee.Id ==
                        employeeId.Value);

        if (employee is null)
        {
            return
                "The selected employee does not exist.";
        }

        bool alreadyLinked =
            await _userManager.Users
                .AnyAsync(
                    user =>
                        user.EmployeeId ==
                        employeeId.Value);

        if (alreadyLinked)
        {
            return
                "This employee already has a user account.";
        }

        if (employee.DepartmentId != departmentId)
        {
            return
                "The employee does not belong to the selected department.";
        }

        return null;
    }

    private static string NormalizeRole(
        string role)
    {
        return role.Trim()
            .ToLowerInvariant() switch
        {
            "superadmin" =>
                AppRoles.SuperAdmin,

            "super admin" =>
                AppRoles.SuperAdmin,

            "departmentadmin" =>
                AppRoles.DepartmentAdmin,

            "department admin" =>
                AppRoles.DepartmentAdmin,

            "admin" =>
                AppRoles.DepartmentAdmin,

            "team lead" =>
                AppRoles.DepartmentAdmin,

            "employee" =>
                AppRoles.Employee,

            _ =>
                role.Trim()
        };
    }
}