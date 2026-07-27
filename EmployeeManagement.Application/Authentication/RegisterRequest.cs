namespace EmployeeManagement.Application.Authentication;

public sealed class RegisterRequest
{
    public string FullName { get; init; } =
        string.Empty;

    public string Email { get; init; } =
        string.Empty;

    public string Password { get; init; } =
        string.Empty;

    public string Role { get; init; } =
        string.Empty;

    public Guid? DepartmentId { get; init; }

    public Guid? EmployeeId { get; init; }
}