namespace EmployeeManagement.API.Contracts.Auth;

public sealed record RegisterResponse(
    string UserId,
    string Email,
    string Role,
    Guid? EmployeeId,
    Guid? DepartmentId);