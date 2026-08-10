using System.Security.Claims;
using EmployeeManagement.Application.Abstractions;

namespace EmployeeManagement.API.Services;

public sealed class CurrentUserService
    : ICurrentUserService
{
    private const string PermissionClaimType =
        "permission";

    private readonly IHttpContextAccessor
        _httpContextAccessor;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor =
            httpContextAccessor;
    }

    private ClaimsPrincipal? User =>
        _httpContextAccessor
            .HttpContext?
            .User;

    public bool IsAuthenticated =>
        User?.Identity?.IsAuthenticated ??
        false;

    public string? UserId =>
        User?.FindFirstValue(
            ClaimTypes.NameIdentifier);

    public Guid? EmployeeId =>
        GetGuidClaim(
            "employeeId");

    public Guid? DepartmentId =>
        GetGuidClaim(
            "departmentId");

    public string? Role =>
        User?.FindFirstValue(
            ClaimTypes.Role);

    public bool IsInRole(
        string role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        return User?.IsInRole(role) ??
               false;
    }

    public bool HasPermission(
        string permission)
    {
        if (string.IsNullOrWhiteSpace(
                permission))
        {
            return false;
        }

        return User?
                   .FindAll(
                       PermissionClaimType)
                   .Any(
                       claim =>
                           string.Equals(
                               claim.Value,
                               permission,
                               StringComparison
                                   .OrdinalIgnoreCase))
               ?? false;
    }

    private Guid? GetGuidClaim(
        string claimType)
    {
        string? value =
            User?.FindFirstValue(
                claimType);

        if (Guid.TryParse(
                value,
                out Guid id))
        {
            return id;
        }

        return null;
    }
}