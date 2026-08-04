namespace EmployeeManagement.API.Contracts;

public sealed class UpdateUserPermissionsRequest
{
    public IReadOnlyCollection<int>
        PermissionIds { get; init; } =
        Array.Empty<int>();
}