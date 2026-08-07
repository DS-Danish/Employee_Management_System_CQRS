namespace EmployeeManagement.API.Contracts;

public sealed record UpdateLeavePolicyRequest(
    int AllowedDaysPerYear);