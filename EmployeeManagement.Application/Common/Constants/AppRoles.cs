namespace EmployeeManagement.Application.Common.Constants;

public static class AppRoles
{
    public const string SuperAdmin = "SuperAdmin";

    public const string TeamLead = "TeamLead";

    public const string Employee = "Employee";

    public static readonly IReadOnlyCollection<string> All =
    [
        SuperAdmin,
        TeamLead,
        Employee
    ];
}