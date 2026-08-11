using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Infrastructure.Identity;
using EmployeeManagement.Infrastructure.Persistence;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagement.API.Contracts;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/permissions")]
[Authorize]
public sealed class PermissionsController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly RoleManager<IdentityRole> _roleManager;

    public PermissionsController(
        ApplicationDbContext dbContext,
        RoleManager<IdentityRole> roleManager)
    {
        _dbContext = dbContext;
        _roleManager = roleManager;
    }

    // GET: api/permissions
    [HttpGet]
    public async Task<ActionResult<
        IReadOnlyList<PermissionResponse>>> GetPermissions(
        CancellationToken cancellationToken)
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        List<PermissionResponse> permissions =
            await _dbContext
                .Permissions
                .AsNoTracking()
                .OrderBy(permission => permission.Name)
                .Select(
                    permission =>
                        new PermissionResponse(
                            permission.Id,
                            permission.Name,
                            permission.Code))
                .ToListAsync(cancellationToken);

        return Ok(permissions);
    }

    // GET: api/permissions/roles
    [HttpGet("roles")]
    public ActionResult<IReadOnlyList<RoleResponse>>
        GetManageableRoles()
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        List<RoleResponse> roles = [];

        if (User.IsInRole(AppRoles.SuperAdmin))
        {
            roles.Add(
                new RoleResponse(
                    AppRoles.TeamLead,
                    "Team Lead"));

            roles.Add(
                new RoleResponse(
                    AppRoles.Employee,
                    "Employee"));

            return Ok(roles);
        }

        if (User.IsInRole(AppRoles.TeamLead))
        {
            roles.Add(
                new RoleResponse(
                    AppRoles.Employee,
                    "Employee"));

            return Ok(roles);
        }

        return Forbid();
    }

    // GET: api/permissions/roles/Employee
    // GET: api/permissions/roles/TeamLead
    [HttpGet("roles/{roleName}")]
    public async Task<ActionResult<
        IReadOnlyList<PermissionResponse>>> GetRolePermissions(
        string roleName,
        CancellationToken cancellationToken)
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        string? normalizedRole =
            NormalizeRole(roleName);

        if (normalizedRole is null)
        {
            return BadRequest(
                new
                {
                    message = "The selected role is invalid."
                });
        }

        if (!CanManageRole(normalizedRole))
        {
            return Forbid();
        }

        IdentityRole? role =
            await _roleManager.FindByNameAsync(
                normalizedRole);

        if (role is null)
        {
            return NotFound(
                new
                {
                    message = "The selected role was not found."
                });
        }

        List<PermissionResponse> permissions =
            await _dbContext
                .RolePermissions
                .AsNoTracking()
                .Where(
                    rolePermission =>
                        rolePermission.RoleId == role.Id)
                .OrderBy(
                    rolePermission =>
                        rolePermission.Permission.Name)
                .Select(
                    rolePermission =>
                        new PermissionResponse(
                            rolePermission.Permission.Id,
                            rolePermission.Permission.Name,
                            rolePermission.Permission.Code))
                .ToListAsync(cancellationToken);

        return Ok(permissions);
    }

    // PUT: api/permissions/roles/Employee
    // PUT: api/permissions/roles/TeamLead
    [HttpPut("roles/{roleName}")]
    public async Task<IActionResult>
        UpdateRolePermissions(
        string roleName,
        [FromBody] UpdateRolePermissionsRequest request,
        CancellationToken cancellationToken)
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        string? normalizedRole =
            NormalizeRole(roleName);

        if (normalizedRole is null)
        {
            return BadRequest(
                new
                {
                    message = "The selected role is invalid."
                });
        }

        if (!CanManageRole(normalizedRole))
        {
            return Forbid();
        }

        IdentityRole? role =
            await _roleManager.FindByNameAsync(
                normalizedRole);

        if (role is null)
        {
            return NotFound(
                new
                {
                    message = "The selected role was not found."
                });
        }

        int[] requestedPermissionIds =
            request.PermissionIds
                .Distinct()
                .ToArray();

        List<int> validPermissionIds =
            await _dbContext
                .Permissions
                .Where(
                    permission =>
                        requestedPermissionIds.Contains(
                            permission.Id))
                .Select(
                    permission =>
                        permission.Id)
                .ToListAsync(cancellationToken);

        if (validPermissionIds.Count !=
            requestedPermissionIds.Length)
        {
            return BadRequest(
                new
                {
                    message =
                        "One or more selected permissions are invalid."
                });
        }

        /*
         * Employees must never receive employee
         * management/delete permissions.
         */
        if (string.Equals(
                normalizedRole,
                AppRoles.Employee,
                StringComparison.OrdinalIgnoreCase))
        {
            bool containsRestrictedPermission =
                await _dbContext
                    .Permissions
                    .AnyAsync(
                        permission =>
                            validPermissionIds.Contains(
                                permission.Id) &&
                            (
                                permission.Code ==
                                    "employees.manage" ||
                                permission.Code ==
                                    "employees.delete"
                            ),
                        cancellationToken);

            if (containsRestrictedPermission)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Employee role cannot receive employee manage or delete permissions."
                    });
            }
        }

        List<RolePermission> currentPermissions =
            await _dbContext
                .RolePermissions
                .Where(
                    rolePermission =>
                        rolePermission.RoleId == role.Id)
                .ToListAsync(cancellationToken);

        HashSet<int> currentPermissionIds =
            currentPermissions
                .Select(
                    rolePermission =>
                        rolePermission.PermissionId)
                .ToHashSet();

        HashSet<int> requestedPermissionIdSet =
            validPermissionIds.ToHashSet();

        List<RolePermission> permissionsToRemove =
            currentPermissions
                .Where(
                    rolePermission =>
                        !requestedPermissionIdSet.Contains(
                            rolePermission.PermissionId))
                .ToList();

        IEnumerable<int> permissionIdsToAdd =
            requestedPermissionIdSet
                .Where(
                    permissionId =>
                        !currentPermissionIds.Contains(
                            permissionId));

        _dbContext
            .RolePermissions
            .RemoveRange(permissionsToRemove);

        foreach (int permissionId in permissionIdsToAdd)
        {
            _dbContext
                .RolePermissions
                .Add(
                    new RolePermission
                    {
                        RoleId = role.Id,
                        PermissionId = permissionId
                    });
        }

        await _dbContext
            .SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private bool CanManagePermissions()
    {
        return
            User.IsInRole(AppRoles.SuperAdmin) ||
            User.IsInRole(AppRoles.TeamLead);
    }

    private bool CanManageRole(
        string roleName)
    {
        // SuperAdmin can configure TeamLead + Employee.
        if (User.IsInRole(AppRoles.SuperAdmin))
        {
            return
                string.Equals(
                    roleName,
                    AppRoles.TeamLead,
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    roleName,
                    AppRoles.Employee,
                    StringComparison.OrdinalIgnoreCase);
        }

        // TeamLead can configure Employee only.
        if (User.IsInRole(AppRoles.TeamLead))
        {
            return string.Equals(
                roleName,
                AppRoles.Employee,
                StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static string? NormalizeRole(
        string roleName)
    {
        if (string.Equals(
                roleName,
                AppRoles.Employee,
                StringComparison.OrdinalIgnoreCase))
        {
            return AppRoles.Employee;
        }

        if (string.Equals(
                roleName,
                AppRoles.TeamLead,
                StringComparison.OrdinalIgnoreCase))
        {
            return AppRoles.TeamLead;
        }

        return null;
    }

    public sealed record PermissionResponse(
        int Id,
        string Name,
        string Code);

    public sealed record RoleResponse(
        string Name,
        string DisplayName);

    public sealed class UpdateRolePermissionsRequest
    {
        public IReadOnlyCollection<int>
            PermissionIds { get; init; } =
            Array.Empty<int>();
    }
}