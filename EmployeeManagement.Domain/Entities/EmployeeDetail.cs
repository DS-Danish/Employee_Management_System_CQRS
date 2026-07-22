namespace EmployeeManagement.Domain.Entities;

public sealed class EmployeeDetail
{
    private EmployeeDetail()
    {
    }

    public EmployeeDetail(
        Guid employeeId,
        string cnic,
        string phoneNumber,
        DateTime dateOfBirth,
        string gender)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        Cnic = cnic;
        PhoneNumber = phoneNumber;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid EmployeeId { get; private set; }

    public string Cnic { get; private set; } = string.Empty;

    public string PhoneNumber { get; private set; } = string.Empty;

    public DateTime DateOfBirth { get; private set; }

    public string Gender { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    public Employee Employee { get; private set; } = null!;

    public void Update(
        string cnic,
        string phoneNumber,
        DateTime dateOfBirth,
        string gender)
    {
        Cnic = cnic;
        PhoneNumber = phoneNumber;
        DateOfBirth = dateOfBirth;
        Gender = gender;
    }
}