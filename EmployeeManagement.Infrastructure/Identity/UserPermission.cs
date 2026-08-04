namespace EmployeeManagement.Infrastructure.Identity;

public sealed class UserPermission
{
    public string UserId { get; set; } =
        string.Empty;

    public ApplicationUser User { get; set; } =
        null!;

    public int PermissionId { get; set; }

    public Permission Permission { get; set; } =
        null!;
}