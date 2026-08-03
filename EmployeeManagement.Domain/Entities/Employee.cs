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
        Guid? departmentId = null,
        Guid? teamLeadId = null)
    {
        Id = Guid.NewGuid();
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        Address = address;
        DepartmentId = departmentId;
        TeamLeadId = teamLeadId;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string FirstName { get; private set; } =
        string.Empty;

    public string LastName { get; private set; } =
        string.Empty;

    public string Email { get; private set; } =
        string.Empty;

    public Address Address { get; private set; } =
        null!;

    public Guid? DepartmentId { get; private set; }

    public Department? Department { get; private set; }

    public Guid? TeamLeadId { get; private set; }

    public Employee? TeamLead { get; private set; }

    public ICollection<Employee> TeamMembers
    {
        get;
        private set;
    } = new List<Employee>();

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

    public void UpdatePersonalDetails(
        string firstName,
        string lastName,
        Address address)
    {
        FirstName = firstName;
        LastName = lastName;
        Address = address;
    }

    public void AssignDepartment(
        Guid? departmentId)
    {
        DepartmentId = departmentId;
    }

    public void AssignTeamLead(
        Guid? teamLeadId)
    {
        if (teamLeadId == Id)
        {
            throw new InvalidOperationException(
                "An employee cannot be assigned as " +
                "their own Team Lead.");
        }

        TeamLeadId = teamLeadId;
    }

    public void RemoveTeamLead()
    {
        TeamLeadId = null;
    }
}