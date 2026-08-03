namespace EmployeeManagement.Infrastructure.Identity;

public static class AuthorizationPolicies
{
    public const string ViewEmployees =
        "ViewEmployees";

    public const string ManageEmployees =
        "ManageEmployees";

    public const string DeleteEmployees =
        "DeleteEmployees";
}