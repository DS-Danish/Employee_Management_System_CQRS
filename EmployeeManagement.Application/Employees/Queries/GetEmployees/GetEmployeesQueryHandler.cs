using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployees;

public sealed class GetEmployeesQueryHandler
    : IRequestHandler<GetEmployeesQuery, PagedResult<EmployeeListItemDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetEmployeesQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<EmployeeListItemDto>> Handle(
        GetEmployeesQuery request,
        CancellationToken cancellationToken)
    {
        IQueryable<Employee> query = _dbContext.Employees
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            string search = request.Search.Trim();

            query = query.Where(x =>
                x.FirstName.Contains(search) ||
                x.LastName.Contains(search) ||
                x.Email.Contains(search));
        }

        int totalCount = await query.CountAsync(
            cancellationToken);

        EmployeeListItemDto[] employees = await query
            .OrderBy(x => x.FirstName)
            .ThenBy(x => x.LastName)
            .Skip(
                (request.PageNumber - 1) *
                request.PageSize)
            .Take(request.PageSize)
            .Select(x => new EmployeeListItemDto(
                x.Id,
                $"{x.FirstName} {x.LastName}",
                x.Email,
                x.Address.City,
                x.DepartmentId,
                x.Department != null
                    ? x.Department.Name
                    : null))
            .ToArrayAsync(cancellationToken);

        return new PagedResult<EmployeeListItemDto>(
            employees,
            request.PageNumber,
            request.PageSize,
            totalCount);
    }
}