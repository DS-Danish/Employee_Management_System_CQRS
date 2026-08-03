using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployee;

public sealed class CreateEmployeeCommandHandler
    : IRequestHandler<CreateEmployee, Guid>
{
    private readonly IApplicationDbContext
        _dbContext;

    private readonly ICurrentUserService
        _currentUserService;

    public CreateEmployeeCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext =
            dbContext;

        _currentUserService =
            currentUserService;
    }

    public async Task<Guid> Handle(
        CreateEmployee request,
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

        if (!isSuperAdmin)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to create employees.");
        }

        string normalizedEmail =
            request.Email
                .Trim()
                .ToLowerInvariant();

        bool employeeExists =
            await _dbContext.Employees
                .AsNoTracking()
                .AnyAsync(
                    employee =>
                        employee.Email ==
                        normalizedEmail,
                    cancellationToken);

        if (employeeExists)
        {
            throw new InvalidOperationException(
                "Employee with this email already exists.");
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

        Employee employee = new(
            request.FirstName.Trim(),
            request.LastName.Trim(),
            normalizedEmail,
            address,
            request.DepartmentId);

        await _dbContext.Employees.AddAsync(
            employee,
            cancellationToken);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return employee.Id;
    }
}