using EmployeeManagement.Domain.Entities;

namespace EmployeeManagement.Application.Leaves.Dtos;

public sealed record LeavePolicyDto(
    Guid Id,
    LeaveType LeaveType,
    int? AllowedDaysPerYear,
    bool IsUnlimited);