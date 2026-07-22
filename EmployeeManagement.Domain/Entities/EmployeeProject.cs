namespace EmployeeManagement.Domain.Entities;

public sealed class EmployeeProject
{
    private EmployeeProject()
    {
    }

    public EmployeeProject(
        Guid employeeId,
        Guid projectId)
    {
        EmployeeId = employeeId;
        ProjectId = projectId;
        AssignedAtUtc = DateTime.UtcNow;
    }

    public Guid EmployeeId { get; private set; }

    public Guid ProjectId { get; private set; }

    public DateTime AssignedAtUtc { get; private set; }

    public Employee Employee { get; private set; } = null!;

    public Project Project { get; private set; } = null!;
}