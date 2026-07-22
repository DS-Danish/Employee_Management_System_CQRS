using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.CreateEmployee;

public sealed class CreateEmployeeCommandHandler
    : IRequestHandler<CreateEmployee, Guid>
{
    private readonly IApplicationDbContext _dbContext;

    public CreateEmployeeCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(
        CreateEmployee request,
        CancellationToken cancellationToken)
    {
        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        bool exists = await _dbContext.Employees
            .AsNoTracking()
            .AnyAsync(
                x => x.Email == normalizedEmail,
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Employee with this email already exists.");
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
            address);

        await _dbContext.Employees.AddAsync(
            employee,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return employee.Id;
    }
}