using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployees;

public sealed class GetEmployeesQueryHandler
    : IRequestHandler<
        GetEmployeesQuery,
        PagedResult<EmployeeListItemDto>>
{
    private readonly IApplicationDbContext
        _dbContext;

    private readonly ICurrentUserService
        _currentUserService;

    public GetEmployeesQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext =
            dbContext;

        _currentUserService =
            currentUserService;
    }

    public async Task<
        PagedResult<EmployeeListItemDto>> Handle(
        GetEmployeesQuery request,
        CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated)
        {
            throw new UnauthorizedAccessException(
                "The current user is not authenticated.");
        }

        IQueryable<Employee> query =
            _dbContext
                .Employees
                .AsNoTracking();

        bool isSuperAdmin =
            _currentUserService.IsInRole(
                AppRoles.SuperAdmin);

        bool isTeamLead =
            _currentUserService.IsInRole(
                AppRoles.TeamLead);

        bool canViewEmployees =
            _currentUserService.HasPermission(
                AppPermissions.ViewEmployees);

        /*
         * SuperAdmin:
         *     Can view all employees.
         *
         * TeamLead:
         *     Can view only employees assigned
         *     to their team.
         *
         * Employee:
         *     Can view employees only when
         *     employees.view permission is assigned.
         */
        if (isTeamLead &&
            !isSuperAdmin)
        {
            Guid teamLeadEmployeeId =
                _currentUserService.EmployeeId
                ?? throw new UnauthorizedAccessException(
                    "The Team Lead account is not linked " +
                    "to an employee profile.");

            query =
                query.Where(
                    employee =>
                        employee.TeamLeadId ==
                        teamLeadEmployeeId);
        }
        else if (!isSuperAdmin &&
                 !canViewEmployees)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to view employees.");
        }

        if (!string.IsNullOrWhiteSpace(
                request.Search))
        {
            string search =
                request.Search.Trim();

            query =
                query.Where(
                    employee =>
                        employee.FirstName.Contains(
                            search) ||
                        employee.LastName.Contains(
                            search) ||
                        employee.Email.Contains(
                            search));
        }

        int pageNumber =
            request.PageNumber < 1
                ? 1
                : request.PageNumber;

        int pageSize =
            request.PageSize < 1
                ? 10
                : request.PageSize;

        int totalCount =
            await query.CountAsync(
                cancellationToken);

        EmployeeListItemDto[] employees =
            await query
                .OrderBy(
                    employee =>
                        employee.FirstName)
                .ThenBy(
                    employee =>
                        employee.LastName)
                .Skip(
                    (pageNumber - 1) *
                    pageSize)
                .Take(
                    pageSize)
                .Select(
                    employee =>
                        new EmployeeListItemDto(
                            employee.Id,
                            $"{employee.FirstName} " +
                            $"{employee.LastName}",
                            employee.Email,
                            employee.Address.City,
                            employee.DepartmentId,
                            employee.Department != null
                                ? employee.Department.Name
                                : null))
                .ToArrayAsync(
                    cancellationToken);

        return new PagedResult<EmployeeListItemDto>(
            employees,
            pageNumber,
            pageSize,
            totalCount);
    }
}