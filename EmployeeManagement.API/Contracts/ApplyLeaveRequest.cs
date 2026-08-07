using EmployeeManagement.Domain.Entities;

namespace EmployeeManagement.API.Contracts;

public sealed record ApplyLeaveRequest(
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason);