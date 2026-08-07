namespace EmployeeManagement.Domain.Entities;

public sealed class LeavePolicy
{
    private LeavePolicy()
    {
    }

    public LeavePolicy(
        Guid id,
        LeaveType leaveType,
        int? allowedDaysPerYear,
        bool isUnlimited)
    {
        Id = id;
        LeaveType = leaveType;
        AllowedDaysPerYear = allowedDaysPerYear;
        IsUnlimited = isUnlimited;
    }

    public Guid Id { get; private set; }

    public LeaveType LeaveType { get; private set; }

    public int? AllowedDaysPerYear { get; private set; }

    public bool IsUnlimited { get; private set; }

    public void UpdateAllowedDays(int allowedDays)
    {
        if (IsUnlimited)
        {
            throw new InvalidOperationException(
                "Unlimited leave policy cannot have an annual limit.");
        }

        if (allowedDays < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(allowedDays));
        }

        AllowedDaysPerYear = allowedDays;
    }
}