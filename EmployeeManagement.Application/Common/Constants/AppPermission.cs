namespace EmployeeManagement.Application.Common.Constants;

public static class AppPermissions
{
    public const string ClaimType =
        "permission";

    // =========================================================
    // EMPLOYEES
    // =========================================================

    public const string ViewEmployees =
        "employees.view";

    public const string ManageEmployees =
        "employees.manage";

    public const string DeleteEmployees =
        "employees.delete";

    // =========================================================
    // DEPARTMENTS
    // =========================================================

    public const string ViewDepartments =
        "departments.view";

    public const string ManageDepartments =
        "departments.manage";

    // =========================================================
    // PROJECTS
    // =========================================================

    public const string ViewProjects =
        "projects.view";

    public const string ManageProjects =
        "projects.manage";

    // =========================================================
    // LEAVES
    // =========================================================

    public const string ViewTeamLeaves =
        "leaves.team.view";

    public const string ReviewTeamLeaves =
        "leaves.team.review";

    public const string ViewAllLeaves =
        "leaves.all.view";

    public const string ManageLeavePolicies =
        "leaves.policies.manage";

    // =========================================================
    // ALL PERMISSIONS
    // =========================================================

    public static readonly
        IReadOnlyCollection<PermissionDefinition>
        All =
        [
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

            new PermissionDefinition(
                "View Team Leaves",
                ViewTeamLeaves),

            new PermissionDefinition(
                "Review Team Leaves",
                ReviewTeamLeaves),

            new PermissionDefinition(
                "View All Leaves",
                ViewAllLeaves),

            new PermissionDefinition(
                "Manage Leave Policies",
                ManageLeavePolicies)
        ];
}

public sealed record PermissionDefinition(
    string Name,
    string Code);