using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Employees
    .Commands.UpdateMyEmployeeProfile;

public sealed class UpdateMyEmployeeProfileCommandHandler
    : IRequestHandler<
        UpdateMyEmployeeProfileCommand,
        bool>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdateMyEmployeeProfileCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        UpdateMyEmployeeProfileCommand request,
        CancellationToken cancellationToken)
    {
        Employee? employee =
            await _dbContext.Employees
                .SingleOrDefaultAsync(
                    employee =>
                        employee.Id ==
                        request.EmployeeId,
                    cancellationToken);

        if (employee is null)
        {
            return false;
        }

        var address = new Address(
            request.Street.Trim(),
            request.City.Trim(),
            request.Country.Trim(),
            request.PostalCode.Trim());

        employee.UpdatePersonalDetails(
            request.FirstName.Trim(),
            request.LastName.Trim(),
            address);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}