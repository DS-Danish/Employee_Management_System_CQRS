namespace EmployeeManagement.Application.Common.Constants;

public static class AppRoles
{
    public const string SuperAdmin = "SuperAdmin";

    public const string DepartmentAdmin = "DepartmentAdmin";

    public const string Employee = "Employee";

    public static readonly IReadOnlyCollection<string> All =
    [
        SuperAdmin,
        DepartmentAdmin,
        Employee
    ];
}