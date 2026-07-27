namespace EmployeeManagement.API.Contracts.Auth;

public sealed record LoginResponse(
    string UserId,
    string FullName,
    string Email,
    IReadOnlyCollection<string> Roles,
    Guid? EmployeeId,
    Guid? DepartmentId);