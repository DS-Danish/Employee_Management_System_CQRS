namespace EmployeeManagement.Domain.Entities;

public sealed class LeaveRequest
{
    private LeaveRequest()
    {
    }

    public LeaveRequest(
        Guid employeeId,
        LeaveType leaveType,
        DateOnly startDate,
        DateOnly endDate,
        int numberOfDays,
        string reason)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        LeaveType = leaveType;
        StartDate = startDate;
        EndDate = endDate;
        NumberOfDays = numberOfDays;
        Reason = reason;
        Status = LeaveStatus.Pending;
        AppliedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid EmployeeId { get; private set; }

    public LeaveType LeaveType { get; private set; }

    public DateOnly StartDate { get; private set; }

    public DateOnly EndDate { get; private set; }

    public int NumberOfDays { get; private set; }

    public string Reason { get; private set; } = string.Empty;

    public LeaveStatus Status { get; private set; }

    public DateTime AppliedAtUtc { get; private set; }

    public string? ReviewedByUserId { get; private set; }

    public DateTime? ReviewedAtUtc { get; private set; }

    public string? ReviewComment { get; private set; }

    public Employee Employee { get; private set; } = null!;

    public void Approve(
        string reviewedByUserId,
        string? comment)
    {
        if (Status != LeaveStatus.Pending)
        {
            throw new InvalidOperationException(
                "Only pending leave requests can be approved.");
        }

        Status = LeaveStatus.Approved;
        ReviewedByUserId = reviewedByUserId;
        ReviewComment = comment;
        ReviewedAtUtc = DateTime.UtcNow;
    }

    public void Reject(
        string reviewedByUserId,
        string comment)
    {
        if (Status != LeaveStatus.Pending)
        {
            throw new InvalidOperationException(
                "Only pending leave requests can be rejected.");
        }

        Status = LeaveStatus.Rejected;
        ReviewedByUserId = reviewedByUserId;
        ReviewComment = comment;
        ReviewedAtUtc = DateTime.UtcNow;
    }
}