namespace EmployeeManagement.API.Contracts.Auth;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    Guid? EmployeeId,
    Guid? DepartmentId);