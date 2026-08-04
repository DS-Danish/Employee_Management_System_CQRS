namespace EmployeeManagement.Infrastructure.Identity;

public sealed class Permission
{
    public int Id { get; set; }

    public string Name { get; set; } =
        string.Empty;

    public string Code { get; set; } =
        string.Empty;

    public ICollection<UserPermission>
        UserPermissions { get; set; } =
        new List<UserPermission>();
}