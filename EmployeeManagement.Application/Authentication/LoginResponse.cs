namespace EmployeeManagement.Application.Authentication;

public sealed class LoginResponse
{
    public string Token { get; init; } =
        string.Empty;

    public DateTime ExpiresAtUtc { get; init; }

    public string UserId { get; init; } =
        string.Empty;

    public string FullName { get; init; } =
        string.Empty;

    public string Email { get; init; } =
        string.Empty;

    public string Role { get; init; } =
        string.Empty;

    public Guid? DepartmentId { get; init; }

    public Guid? EmployeeId { get; init; }
}