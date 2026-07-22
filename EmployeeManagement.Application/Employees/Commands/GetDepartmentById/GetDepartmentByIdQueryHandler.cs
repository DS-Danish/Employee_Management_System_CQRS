using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Departments.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Queries.GetDepartmentById;

public sealed class GetDepartmentByIdQueryHandler
    : IRequestHandler<GetDepartmentByIdQuery, DepartmentDto?>
{
    private readonly IApplicationDbContext _dbContext;

    public GetDepartmentByIdQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DepartmentDto?> Handle(
        GetDepartmentByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Departments
            .AsNoTracking()
            .Where(department => department.Id == request.Id)
            .Select(department => new DepartmentDto(
                department.Id,
                department.Name,
                department.CreatedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);
    }
}