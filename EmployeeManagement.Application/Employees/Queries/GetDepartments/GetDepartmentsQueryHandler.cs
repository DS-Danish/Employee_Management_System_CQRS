using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Departments.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartments;

public sealed class GetDepartmentsQueryHandler
    : IRequestHandler<
        GetDepartmentsQuery,
        IReadOnlyList<DepartmentDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetDepartmentsQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<DepartmentDto>> Handle(
        GetDepartmentsQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Departments
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new DepartmentDto(
                x.Id,
                x.Name,
                x.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }
}