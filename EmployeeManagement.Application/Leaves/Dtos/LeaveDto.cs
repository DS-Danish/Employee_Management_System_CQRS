using EmployeeManagement.Domain.Entities;

namespace EmployeeManagement.Application.Leaves.Dtos;

public sealed record LeaveDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    int NumberOfDays,
    string Reason,
    LeaveStatus Status,
    DateTime AppliedAtUtc,
    string? ReviewedByUserId,
    DateTime? ReviewedAtUtc,
    string? ReviewComment);