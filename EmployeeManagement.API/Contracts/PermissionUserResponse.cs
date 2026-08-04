namespace EmployeeManagement.API.Contracts;

public sealed record PermissionUserResponse(
    string Id,
    string Name,
    string Email,
    string Role);