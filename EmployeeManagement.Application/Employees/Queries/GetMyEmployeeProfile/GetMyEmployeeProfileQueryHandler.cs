using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Employees.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees
    .Queries.GetMyEmployeeProfile;

public sealed class GetMyEmployeeProfileQueryHandler
    : IRequestHandler<
        GetMyEmployeeProfileQuery,
        MyEmployeeProfileDto?>
{
    private readonly IApplicationDbContext _dbContext;

    public GetMyEmployeeProfileQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MyEmployeeProfileDto?> Handle(
        GetMyEmployeeProfileQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Employees
            .AsNoTracking()
            .Where(employee =>
                employee.Id == request.EmployeeId)
            .Select(employee =>
                new MyEmployeeProfileDto(
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
                    employee.DepartmentId,
                    employee.Department != null
                        ? employee.Department.Name
                        : null,
                    employee.CreatedAtUtc))
            .SingleOrDefaultAsync(
                cancellationToken);
    }
}