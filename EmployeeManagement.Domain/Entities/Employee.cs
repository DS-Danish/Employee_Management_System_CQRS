namespace EmployeeManagement.Domain.Entities;

public sealed class Employee
{
    private Employee()
    {
    }

    public Employee(
        string firstName,
        string lastName,
        string email,
        Address address,
        Guid? departmentId = null)
    {
        Id = Guid.NewGuid();
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        Address = address;
        DepartmentId = departmentId;
        CreatedAtUtc = DateTime.UtcNow;
    }
    public Guid Id { get; private set; }

    public string FirstName { get; private set; } = string.Empty;

    public string LastName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public Address Address { get; private set; } = null!;

    public Guid? DepartmentId { get; private set; }

    public Department? Department { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public void Update(
        string firstName,
        string lastName,
        string email,
        Address address,
        Guid? departmentId)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        Address = address;
        DepartmentId = departmentId;
    }

    public void AssignDepartment(Guid? departmentId)
    {
        DepartmentId = departmentId;
    }
}