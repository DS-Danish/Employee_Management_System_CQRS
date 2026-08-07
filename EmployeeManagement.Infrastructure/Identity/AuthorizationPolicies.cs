namespace EmployeeManagement.Infrastructure.Identity;

public static class AuthorizationPolicies
{
    public const string ViewEmployees =
        "ViewEmployees";

    public const string ManageEmployees =
        "ManageEmployees";

    public const string DeleteEmployees =
        "DeleteEmployees";

    public const string ViewDepartments =
        "ViewDepartments";

    public const string ManageDepartments =
        "ManageDepartments";

    public const string ViewProjects =
        "ViewProjects";

    public const string ManageProjects =
        "ManageProjects";

    public const string ViewTeamLeaves =
        "ViewTeamLeaves";

    public const string ReviewTeamLeaves =
        "ReviewTeamLeaves";

    public const string ViewAllLeaves =
        "ViewAllLeaves";

    public const string ManageLeavePolicies =
        "ManageLeavePolicies";
}