using System.Security.Claims;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Infrastructure.Identity;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/permissions")]
[Authorize]
public sealed class PermissionsController
    : ControllerBase
{
    private readonly ApplicationDbContext
        _dbContext;

    private readonly UserManager<ApplicationUser>
        _userManager;

    public PermissionsController(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    /*
     * SuperAdmin and TeamLead/Admin can view
     * the list of available permissions.
     *
     * Employee/User cannot access permission
     * management at all.
     */
    [HttpGet]
    public async Task<ActionResult<
        IReadOnlyList<PermissionResponse>>>
        GetPermissions(
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
                .OrderBy(
                    permission =>
                        permission.Name)
                .Select(
                    permission =>
                        new PermissionResponse(
                            permission.Id,
                            permission.Name,
                            permission.Code))
                .ToListAsync(
                    cancellationToken);

        return Ok(permissions);
    }

    /*
     * SuperAdmin:
     *      sees TeamLead/Admin + Employee/User.
     *
     * TeamLead/Admin:
     *      sees Employee/User only.
     *
     * Nobody sees themselves.
     */
    [HttpGet("users")]
    public async Task<ActionResult<
        IReadOnlyList<PermissionUserResponse>>>
        GetUsers(
            CancellationToken cancellationToken)
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        string? currentUserId =
            GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(
                currentUserId))
        {
            return Unauthorized();
        }

        List<ApplicationUser> users =
            await _userManager
                .Users
                .AsNoTracking()
                .Where(
                    user =>
                        user.Id !=
                        currentUserId)
                .OrderBy(
                    user =>
                        user.FullName)
                .ToListAsync(
                    cancellationToken);

        var result =
            new List<PermissionUserResponse>();

        foreach (
            ApplicationUser user
            in users)
        {
            IList<string> roles =
                await _userManager
                    .GetRolesAsync(
                        user);

            string? targetRole =
                GetPrimaryRole(
                    roles);

            if (targetRole is null)
            {
                continue;
            }

            if (!CanManageRole(
                    targetRole))
            {
                continue;
            }

            result.Add(
                new PermissionUserResponse(
                    user.Id,
                    user.FullName,
                    user.Email ??
                        string.Empty,
                    targetRole));
        }

        return Ok(result);
    }

    /*
     * Returns permissions for one target user.
     *
     * Access restrictions are evaluated before
     * any permission information is returned.
     */
    [HttpGet("users/{userId}")]
    public async Task<ActionResult<
        IReadOnlyList<PermissionResponse>>>
        GetUserPermissions(
            string userId,
            CancellationToken cancellationToken)
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        string? currentUserId =
            GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(
                currentUserId))
        {
            return Unauthorized();
        }

        /*
         * Nobody can inspect/manage their own
         * permissions through this management API.
         */
        if (string.Equals(
                currentUserId,
                userId,
                StringComparison.Ordinal))
        {
            return BadRequest(
                new
                {
                    message =
                        "You cannot manage your own permissions."
                });
        }

        ApplicationUser? targetUser =
            await _userManager
                .FindByIdAsync(
                    userId);

        if (targetUser is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User was not found."
                });
        }

        IList<string> targetRoles =
            await _userManager
                .GetRolesAsync(
                    targetUser);

        string? targetRole =
            GetPrimaryRole(
                targetRoles);

        if (targetRole is null)
        {
            return BadRequest(
                new
                {
                    message =
                        "The selected account does not have a supported role."
                });
        }

        if (!CanManageRole(
                targetRole))
        {
            return Forbid();
        }

        List<PermissionResponse> permissions =
            await _dbContext
                .UserPermissions
                .AsNoTracking()
                .Where(
                    userPermission =>
                        userPermission.UserId ==
                        userId)
                .OrderBy(
                    userPermission =>
                        userPermission
                            .Permission
                            .Name)
                .Select(
                    userPermission =>
                        new PermissionResponse(
                            userPermission
                                .Permission
                                .Id,

                            userPermission
                                .Permission
                                .Name,

                            userPermission
                                .Permission
                                .Code))
                .ToListAsync(
                    cancellationToken);

        return Ok(permissions);
    }

    /*
     * Update permissions.
     *
     * SuperAdmin:
     *      TeamLead/Admin + Employee/User.
     *
     * TeamLead/Admin:
     *      Employee/User only.
     *
     * Employee/User:
     *      Nobody.
     *
     * Self modification:
     *      Never allowed.
     */
    [HttpPut("users/{userId}")]
    public async Task<IActionResult>
        UpdateUserPermissions(
            string userId,
            [FromBody]
            UpdateUserPermissionsRequest request,
            CancellationToken cancellationToken)
    {
        if (!CanManagePermissions())
        {
            return Forbid();
        }

        string? currentUserId =
            GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(
                currentUserId))
        {
            return Unauthorized();
        }

        /*
         * Critical security rule:
         * no account can modify itself.
         */
        if (string.Equals(
                currentUserId,
                userId,
                StringComparison.Ordinal))
        {
            return BadRequest(
                new
                {
                    message =
                        "You cannot modify your own permissions."
                });
        }

        ApplicationUser? targetUser =
            await _userManager
                .FindByIdAsync(
                    userId);

        if (targetUser is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User was not found."
                });
        }

        IList<string> targetRoles =
            await _userManager
                .GetRolesAsync(
                    targetUser);

        string? targetRole =
            GetPrimaryRole(
                targetRoles);

        if (targetRole is null)
        {
            return BadRequest(
                new
                {
                    message =
                        "The selected account does not have a supported role."
                });
        }

        if (!CanManageRole(
                targetRole))
        {
            return Forbid();
        }

        int[] requestedPermissionIds =
            request
                .PermissionIds
                .Distinct()
                .ToArray();

        List<int> validPermissionIds =
            await _dbContext
                .Permissions
                .Where(
                    permission =>
                        requestedPermissionIds
                            .Contains(
                                permission.Id))
                .Select(
                    permission =>
                        permission.Id)
                .ToListAsync(
                    cancellationToken);

        if (
            validPermissionIds.Count !=
            requestedPermissionIds.Length)
        {
            return BadRequest(
                new
                {
                    message =
                        "One or more selected permissions are invalid."
                });
        }

        List<UserPermission> currentPermissions =
            await _dbContext
                .UserPermissions
                .Where(
                    userPermission =>
                        userPermission.UserId == userId)
                .ToListAsync(cancellationToken);

        HashSet<int> currentPermissionIds =
            currentPermissions
                .Select(
                    userPermission =>
                        userPermission.PermissionId)
                .ToHashSet();

        HashSet<int> requestedPermissionIdSet =
            validPermissionIds.ToHashSet();

        List<UserPermission> permissionsToRemove =
            currentPermissions
                .Where(
                    userPermission =>
                        !requestedPermissionIdSet.Contains(
                            userPermission.PermissionId))
                .ToList();

        IEnumerable<int> permissionIdsToAdd =
            requestedPermissionIdSet
                .Where(
                    permissionId =>
                        !currentPermissionIds.Contains(
                            permissionId));

        _dbContext
            .UserPermissions
            .RemoveRange(
                permissionsToRemove);

        foreach (int permissionId in permissionIdsToAdd)
        {
            _dbContext
                .UserPermissions
                .Add(
                    new UserPermission
                    {
                        UserId = userId,
                        PermissionId = permissionId
                    });
        }

        await _dbContext
            .SaveChangesAsync(
                cancellationToken);

        return NoContent(); 
        }

    /*
     * Only SuperAdmin and TeamLead/Admin
     * are permission administrators.
     */
    private bool CanManagePermissions()
    {
        return
            User.IsInRole(
                AppRoles.SuperAdmin) ||
            User.IsInRole(
                AppRoles.TeamLead);
    }

    /*
     * Determines whether the currently
     * authenticated user can manage the
     * TARGET account's role.
     */
    private bool CanManageRole(
        string targetRole)
    {
        /*
         * SuperAdmin:
         *
         * Can manage TeamLead/Admin
         * and Employee/User.
         *
         * Cannot manage another SuperAdmin
         * through this permission API.
         */
        if (
            User.IsInRole(
                AppRoles.SuperAdmin))
        {
            return
                string.Equals(
                    targetRole,
                    AppRoles.TeamLead,
                    StringComparison
                        .OrdinalIgnoreCase) ||
                string.Equals(
                    targetRole,
                    AppRoles.Employee,
                    StringComparison
                        .OrdinalIgnoreCase);
        }

        /*
         * TeamLead/Admin:
         *
         * Can manage Employee/User only.
         */
        if (
            User.IsInRole(
                AppRoles.TeamLead))
        {
            return string.Equals(
                targetRole,
                AppRoles.Employee,
                StringComparison
                    .OrdinalIgnoreCase);
        }

        return false;
    }

    /*
     * TeamLead users also have Employee
     * role in your current system.
     *
     * Therefore TeamLead must be checked
     * before Employee.
     */
    private static string?
        GetPrimaryRole(
            IEnumerable<string> roles)
    {
        HashSet<string> assignedRoles =
            roles.ToHashSet(
                StringComparer
                    .OrdinalIgnoreCase);

        if (
            assignedRoles.Contains(
                AppRoles.SuperAdmin))
        {
            return AppRoles.SuperAdmin;
        }

        if (
            assignedRoles.Contains(
                AppRoles.TeamLead))
        {
            return AppRoles.TeamLead;
        }

        if (
            assignedRoles.Contains(
                AppRoles.Employee))
        {
            return AppRoles.Employee;
        }

        return null;
    }

    private string?
        GetCurrentUserId()
    {
        return User.FindFirstValue(
            ClaimTypes.NameIdentifier);
    }

    public sealed record PermissionResponse(
        int Id,
        string Name,
        string Code);

    public sealed record PermissionUserResponse(
        string Id,
        string Name,
        string Email,
        string Role);

    public sealed class
        UpdateUserPermissionsRequest
    {
        public IReadOnlyCollection<int>
            PermissionIds { get; init; } =
            Array.Empty<int>();
    }
}