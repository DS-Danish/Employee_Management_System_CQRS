namespace EmployeeManagement.Infrastructure.Identity;

public static class AppPermissions
{
    public const string ClaimType =
        "permission";

    public const string ViewEmployees =
        "employees.view";

    public const string ManageEmployees =
        "employees.manage";

    public const string DeleteEmployees =
        "employees.delete";

    public const string ViewDepartments =
        "departments.view";

    public const string ManageDepartments =
        "departments.manage";

    public const string ViewProjects =
        "projects.view";

    public const string ManageProjects =
        "projects.manage";

    public static readonly
        IReadOnlyCollection<
            PermissionDefinition>
        All =
        new[]
        {
            new PermissionDefinition(
                "View Employees",
                ViewEmployees),

            new PermissionDefinition(
                "Manage Employees",
                ManageEmployees),

            new PermissionDefinition(
                "Delete Employees",
                DeleteEmployees),

            new PermissionDefinition(
                "View Departments",
                ViewDepartments),

            new PermissionDefinition(
                "Manage Departments",
                ManageDepartments),

            new PermissionDefinition(
                "View Projects",
                ViewProjects),

            new PermissionDefinition(
                "Manage Projects",
                ManageProjects),
        };
}

public sealed record
    PermissionDefinition(
        string Name,
        string Code);