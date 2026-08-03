namespace EmployeeManagement.Domain.Entities;

public sealed class Project
{
    private Project()
    {
    }

    public Project(
        string name,
        string? description,
        DateTime startDate,
        DateTime? endDate)
    {
        Id = Guid.NewGuid();
        Name = name;
        Description = description;
        StartDate = startDate;
        EndDate = endDate;

        Status = ProjectStatus.Active;

        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } =
        string.Empty;

    public string? Description { get; private set; }

    public DateTime StartDate { get; private set; }

    public DateTime? EndDate { get; private set; }

    public ProjectStatus Status { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public void Update(
        string name,
        string? description,
        DateTime startDate,
        DateTime? endDate)
    {
        Name = name;
        Description = description;
        StartDate = startDate;
        EndDate = endDate;
    }

    public bool MarkAsCompleted()
    {
        if (Status == ProjectStatus.Completed)
        {
            return false;
        }

        Status = ProjectStatus.Completed;

        return true;
    }
}