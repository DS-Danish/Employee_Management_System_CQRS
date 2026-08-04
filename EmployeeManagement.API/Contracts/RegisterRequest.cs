namespace EmployeeManagement.API.Contracts;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    Guid? EmployeeId,
    Guid? DepartmentId);