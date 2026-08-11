namespace EmployeeManagement.API.Contracts;

public sealed class UpdateRolePermissionsRequest
{
    public IReadOnlyCollection<int> PermissionIds { get; init; } =
        Array.Empty<int>();
}