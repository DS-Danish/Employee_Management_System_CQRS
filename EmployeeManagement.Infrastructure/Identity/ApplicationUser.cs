using Microsoft.AspNetCore.Identity;

namespace EmployeeManagement.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } =
        string.Empty;

    public Guid? DepartmentId { get; set; }

    public Guid? EmployeeId { get; set; }
}