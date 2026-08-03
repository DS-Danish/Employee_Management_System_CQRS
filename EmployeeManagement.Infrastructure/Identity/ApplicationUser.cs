using Microsoft.AspNetCore.Identity;

namespace EmployeeManagement.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;

    public Guid? EmployeeId { get; set; }

    public Guid? DepartmentId { get; set; }
}