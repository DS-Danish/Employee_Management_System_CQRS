using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeManagement.Application.Authentication;
using EmployeeManagement.Domain.Entities;
using EmployeeManagement.Infrastructure.Identity;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using EmployeeManagement.Application.Common.Constants;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser>
        _userManager;

    private readonly ApplicationDbContext
        _databaseContext;

    private readonly JwtSettings
        _jwtSettings;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext databaseContext,
        IOptions<JwtSettings> jwtOptions)
    {
        _userManager = userManager;
        _databaseContext = databaseContext;
        _jwtSettings = jwtOptions.Value;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(
        typeof(LoginResponse),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(
                new
                {
                    message =
                        "Email and password are required."
                });
        }

        string normalizedEmail =
            request.Email
                .Trim()
                .ToLowerInvariant();

        ApplicationUser? user =
            await _userManager.FindByEmailAsync(
                normalizedEmail);

        if (user is null)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Invalid email or password."
                });
        }

        bool passwordIsValid =
            await _userManager.CheckPasswordAsync(
                user,
                request.Password);

        if (!passwordIsValid)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Invalid email or password."
                });
        }

        IList<string> assignedRoles =
            await _userManager.GetRolesAsync(user);

        List<string> supportedRoles =
            assignedRoles
                .Where(role =>
                    AppRoles.All.Contains(
                        role,
                        StringComparer.OrdinalIgnoreCase))
                .ToList();

        if (supportedRoles.Count == 0)
        {
            return Unauthorized(
                new
                {
                    message =
                        "No supported role has been assigned to this account."
                });
        }

        string primaryRole =
            GetPrimaryRole(supportedRoles);

        DateTime expiresAtUtc =
            DateTime.UtcNow.AddMinutes(
                _jwtSettings.ExpirationMinutes);

        string token =
            CreateJwtToken(
                user,
                supportedRoles,
                expiresAtUtc);

        var response =
            new LoginResponse
            {
                Token =
                    token,

                ExpiresAtUtc =
                    expiresAtUtc,

                UserId =
                    user.Id,

                FullName =
                    user.FullName,

                Email =
                    user.Email ??
                    normalizedEmail,

                Role =
                    primaryRole,

                DepartmentId =
                    user.DepartmentId,

                EmployeeId =
                    user.EmployeeId
            };

        return Ok(response);
    }

    [HttpGet("available-employees")]
    [Authorize(Roles = AppRoles.SuperAdmin)]
    public async Task<ActionResult<
        IReadOnlyList<AvailableEmployeeResponse>>>
        GetAvailableEmployees(
            CancellationToken cancellationToken)
    {
        List<Guid> linkedEmployeeIds =
            await _userManager.Users
                .Where(user =>
                    user.EmployeeId.HasValue)
                .Select(user =>
                    user.EmployeeId!.Value)
                .ToListAsync(
                    cancellationToken);

        IReadOnlyList<AvailableEmployeeResponse>
            employees =
            await _databaseContext.Employees
                .AsNoTracking()
                .Where(employee =>
                    !linkedEmployeeIds.Contains(
                        employee.Id))
                .OrderBy(employee =>
                    employee.FirstName)
                .ThenBy(employee =>
                    employee.LastName)
                .Select(employee =>
                    new AvailableEmployeeResponse(
                        employee.Id,
                        employee.FirstName +
                        " " +
                        employee.LastName,
                        employee.Email,
                        employee.DepartmentId))
                .ToListAsync(
                    cancellationToken);

        return Ok(employees);
    }

    [HttpPost("register")]
    [Authorize(Roles = AppRoles.SuperAdmin)]
    [ProducesResponseType(
        typeof(RegisterResponse),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(
                new
                {
                    message =
                        "Full name is required."
                });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(
                new
                {
                    message =
                        "Email is required."
                });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(
                new
                {
                    message =
                        "Password is required."
                });
        }

        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(
                new
                {
                    message =
                        "Role is required."
                });
        }

        string role =
            NormalizeRole(request.Role);

        if (!AppRoles.All.Contains(
                role,
                StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(
                new
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
            return BadRequest(
                new
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
            return BadRequest(
                new
                {
                    message =
                        validationError
                });
        }

        bool requiresEmployee =
            role == AppRoles.Employee ||
            role == AppRoles.TeamLead;

        var user =
            new ApplicationUser
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
                    requiresEmployee
                        ? request.EmployeeId
                        : null
            };

        IdentityResult createResult =
            await _userManager.CreateAsync(
                user,
                request.Password);

        if (!createResult.Succeeded)
        {
            return BadRequest(
                new
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

            return BadRequest(
                new
                {
                    message =
                        "Account role could not be assigned.",

                    errors =
                        roleResult.Errors.Select(
                            error =>
                                error.Description)
                });
        }

        /*
         * A Team Lead is also an employee and therefore receives
         * both TeamLead and Employee roles.
         */
        if (role == AppRoles.TeamLead)
        {
            IdentityResult employeeRoleResult =
                await _userManager.AddToRoleAsync(
                    user,
                    AppRoles.Employee);

            if (!employeeRoleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);

                return BadRequest(
                    new
                    {
                        message =
                            "The Team Lead employee role could not be assigned.",

                        errors =
                            employeeRoleResult.Errors.Select(
                                error =>
                                    error.Description)
                    });
            }
        }

        var response =
            new RegisterResponse
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

    private static string GetPrimaryRole(
        IEnumerable<string> roles)
    {
        HashSet<string> assignedRoles =
            roles.ToHashSet(
                StringComparer.OrdinalIgnoreCase);

        if (assignedRoles.Contains(
                AppRoles.SuperAdmin))
        {
            return AppRoles.SuperAdmin;
        }

        if (assignedRoles.Contains(
                AppRoles.TeamLead))
        {
            return AppRoles.TeamLead;
        }

        if (assignedRoles.Contains(
                AppRoles.Employee))
        {
            return AppRoles.Employee;
        }

        throw new InvalidOperationException(
            "The authenticated account has no supported role.");
    }

    private string CreateJwtToken(
        ApplicationUser user,
        IEnumerable<string> roles,
        DateTime expiresAtUtc)
    {
        var claims =
            new List<Claim>
            {
                new(
                    JwtRegisteredClaimNames.Sub,
                    user.Id),

                new(
                    JwtRegisteredClaimNames.Email,
                    user.Email ??
                    string.Empty),

                new(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString()),

                new(
                    ClaimTypes.NameIdentifier,
                    user.Id),

                new(
                    ClaimTypes.Name,
                    user.FullName)
            };

        foreach (string role in roles.Distinct(
                     StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(
                new Claim(
                    ClaimTypes.Role,
                    role));
        }

        if (user.DepartmentId.HasValue)
        {
            claims.Add(
                new Claim(
                    "departmentId",
                    user.DepartmentId.Value
                        .ToString()));
        }

        if (user.EmployeeId.HasValue)
        {
            claims.Add(
                new Claim(
                    "employeeId",
                    user.EmployeeId.Value
                        .ToString()));
        }

        var signingKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _jwtSettings.Key));

        var signingCredentials =
            new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

        var token =
            new JwtSecurityToken(
                issuer:
                    _jwtSettings.Issuer,

                audience:
                    _jwtSettings.Audience,

                claims:
                    claims,

                notBefore:
                    DateTime.UtcNow,

                expires:
                    expiresAtUtc,

                signingCredentials:
                    signingCredentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    private async Task<string?> ValidateRoleDataAsync(
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

        bool requiresEmployee =
            role == AppRoles.Employee ||
            role == AppRoles.TeamLead;

        if (!requiresEmployee)
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

    public sealed record AvailableEmployeeResponse(
    Guid Id,
    string FullName,
    string Email,
    Guid? DepartmentId);

    private static string NormalizeRole(
        string role)
    {
        return role
            .Trim()
            .ToLowerInvariant() switch
        {
            "superadmin" =>
                AppRoles.SuperAdmin,

            "super admin" =>
                AppRoles.SuperAdmin,

            "teamlead" =>
                AppRoles.TeamLead,

            "team lead" =>
                AppRoles.TeamLead,

            "employee" =>
                AppRoles.Employee,

            _ =>
                role.Trim()
        };
    }
}