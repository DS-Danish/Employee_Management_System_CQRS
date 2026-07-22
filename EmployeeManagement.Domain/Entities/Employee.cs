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
        Address address)
    {
        Id = Guid.NewGuid();
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        Address = address;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string FirstName { get; private set; } = string.Empty;

    public string LastName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public Address Address { get; private set; } = null!;

    public DateTime CreatedAtUtc { get; private set; }

    public void Update(
        string firstName,
        string lastName,
        string email,
        Address address)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        Address = address;
    }
}