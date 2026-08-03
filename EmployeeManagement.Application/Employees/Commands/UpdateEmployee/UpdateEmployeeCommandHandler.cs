using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.UpdateEmployee;

public sealed class UpdateEmployeeCommandHandler
    : IRequestHandler<UpdateEmployee, bool>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public UpdateEmployeeCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        UpdateEmployee request,
        CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated)
        {
            throw new UnauthorizedAccessException(
                "The current user is not authenticated.");
        }

        bool isSuperAdmin =
            _currentUserService.IsInRole(
                AppRoles.SuperAdmin);

        bool isTeamLead =
            _currentUserService.IsInRole(
                AppRoles.TeamLead);

        IQueryable<Employee> employeeQuery =
            _dbContext.Employees;

        if (isTeamLead && !isSuperAdmin)
        {
            Guid teamLeadEmployeeId =
                _currentUserService.EmployeeId
                ?? throw new UnauthorizedAccessException(
                    "The Team Lead account is not linked " +
                    "to an employee profile.");

            employeeQuery =
                employeeQuery.Where(
                    employee =>
                        employee.TeamLeadId ==
                        teamLeadEmployeeId);
        }
        else if (!isSuperAdmin)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to update employees.");
        }

        Employee? employee =
            await employeeQuery
                .SingleOrDefaultAsync(
                    employee =>
                        employee.Id == request.Id,
                    cancellationToken);

        if (employee is null)
        {
            return false;
        }

        string normalizedEmail =
            request.Email
                .Trim()
                .ToLowerInvariant();

        bool emailExists =
            await _dbContext.Employees
                .AsNoTracking()
                .AnyAsync(
                    existingEmployee =>
                        existingEmployee.Id !=
                        request.Id &&
                        existingEmployee.Email ==
                        normalizedEmail,
                    cancellationToken);

        if (emailExists)
        {
            throw new InvalidOperationException(
                "Another employee is already using this email.");
        }

        if (request.DepartmentId.HasValue)
        {
            bool departmentExists =
                await _dbContext.Departments
                    .AsNoTracking()
                    .AnyAsync(
                        department =>
                            department.Id ==
                            request.DepartmentId.Value,
                        cancellationToken);

            if (!departmentExists)
            {
                throw new InvalidOperationException(
                    "The selected department does not exist.");
            }
        }

        Address address = new(
            request.Street.Trim(),
            request.City.Trim(),
            request.Country.Trim(),
            request.PostalCode.Trim());

        employee.Update(
            request.FirstName.Trim(),
            request.LastName.Trim(),
            normalizedEmail,
            address,
            request.DepartmentId);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}