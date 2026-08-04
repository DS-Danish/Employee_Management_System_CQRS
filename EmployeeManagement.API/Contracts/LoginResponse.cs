namespace EmployeeManagement.API.Contracts;

public sealed class LoginResponse
{
    public string Token { get; set; } =
        string.Empty;

    public DateTime ExpiresAtUtc {
        get;
        set;
    }

    public string UserId { get; set; } =
        string.Empty;

    public string FullName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string Role { get; set; } =
        string.Empty;

    public Guid? DepartmentId {
        get;
        set;
    }

    public Guid? EmployeeId {
        get;
        set;
    }

    public IReadOnlyCollection<string>
        Permissions { get; set; } =
        Array.Empty<string>();
}