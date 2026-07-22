using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees.Commands.UpdateEmployee;

public sealed class UpdateEmployeeCommandHandler
    : IRequestHandler<UpdateEmployee, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdateEmployeeCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        UpdateEmployee request,
        CancellationToken cancellationToken)
    {
        Employee? employee = await _dbContext.Employees
            .SingleOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (employee is null)
        {
            return false;
        }

        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        bool emailExists = await _dbContext.Employees
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.Email == normalizedEmail,
                cancellationToken);

        if (emailExists)
        {
            throw new InvalidOperationException(
                "Another employee is already using this email.");
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
            address);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}