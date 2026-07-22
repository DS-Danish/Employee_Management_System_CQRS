namespace EmployeeManagement.Domain.Entities;

public sealed class Department
{
    private Department()
    {
    }

    public Department(string name)
    {
        Id = Guid.NewGuid();
        Name = name;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    public void Update(string name)
    {
        Name = name;
    }
}