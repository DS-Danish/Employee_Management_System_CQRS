namespace EmployeeManagement.Application.Abstractions;

public interface ICurrentUserService
{
    bool IsAuthenticated { get; }

    string? UserId { get; }

    Guid? EmployeeId { get; }

    Guid? DepartmentId { get; }

    string? Role { get; }

    bool IsInRole(string role);
}