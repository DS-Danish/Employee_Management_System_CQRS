using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.Employees.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Queries.GetEmployeeById;

public sealed class GetEmployeeByIdQueryHandler
    : IRequestHandler<GetEmployeeByIdQuery, EmployeeDto?>
{
    private readonly IApplicationDbContext _dbContext;

    public GetEmployeeByIdQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<EmployeeDto?> Handle(
        GetEmployeeByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Employees
            .AsNoTracking()
            .Where(e => e.Id == request.Id)
            .Select(e => new EmployeeDto(
                e.Id,
                e.FirstName,
                e.LastName,
                e.FirstName + " " + e.LastName,
                e.Email,
                e.Address.Street,
                e.Address.City,
                e.Address.Country,
                e.Address.PostalCode,
                e.CreatedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);
    }
}