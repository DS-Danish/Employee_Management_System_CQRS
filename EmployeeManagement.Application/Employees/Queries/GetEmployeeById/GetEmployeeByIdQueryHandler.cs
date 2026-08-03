using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeById;

public sealed class GetEmployeeByIdQueryHandler
    : IRequestHandler<GetEmployeeByIdQuery, EmployeeDto?>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetEmployeeByIdQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDto?> Handle(
        GetEmployeeByIdQuery request,
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

        IQueryable<Employee> query =
            _dbContext.Employees
                .AsNoTracking()
                .Where(employee =>
                    employee.Id == request.Id);

        if (isTeamLead && !isSuperAdmin)
        {
            Guid teamLeadEmployeeId =
                _currentUserService.EmployeeId
                ?? throw new UnauthorizedAccessException(
                    "The Team Lead account is not linked " +
                    "to an employee profile.");

            query = query.Where(
                employee =>
                    employee.TeamLeadId ==
                    teamLeadEmployeeId);
        }
        else if (!isSuperAdmin)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to view employees.");
        }

        return await query
            .Select(employee =>
                new EmployeeDto(
                    employee.Id,
                    employee.FirstName,
                    employee.LastName,
                    employee.FirstName +
                    " " +
                    employee.LastName,
                    employee.Email,
                    employee.Address.Street,
                    employee.Address.City,
                    employee.Address.Country,
                    employee.Address.PostalCode,
                    employee.CreatedAtUtc))
            .SingleOrDefaultAsync(
                cancellationToken);
    }
}