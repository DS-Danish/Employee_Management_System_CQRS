namespace EmployeeManagement.API.Contracts;

public sealed record PermissionResponse(
    int Id,
    string Name,
    string Code);