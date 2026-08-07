using EmployeeManagement.Domain.Entities;

namespace EmployeeManagement.Application.Leaves.Dtos;

public sealed record LeaveBalanceDto(
    LeaveType LeaveType,
    int? AllocatedDays,
    int ApprovedDays,
    int PendingDays,
    int? RemainingDays,
    int? AvailableToApplyDays,
    bool IsUnlimited);