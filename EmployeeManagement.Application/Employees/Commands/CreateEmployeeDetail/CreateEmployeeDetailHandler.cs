using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.CreateEmployeeDetail;

public sealed class CreateEmployeeDetailHandler
    : IRequestHandler<CreateEmployeeDetail, Guid>
{
    private readonly IApplicationDbContext _dbContext;

    public CreateEmployeeDetailHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(
        CreateEmployeeDetail request,
        CancellationToken cancellationToken)
    {
        bool employeeExists = await _dbContext.Employees
            .AnyAsync(
                x => x.Id == request.EmployeeId,
                cancellationToken);

        if (!employeeExists)
        {
            throw new InvalidOperationException(
                "Employee not found.");
        }

        bool detailExists = await _dbContext.EmployeeDetails
            .AnyAsync(
                x => x.EmployeeId == request.EmployeeId,
                cancellationToken);

        if (detailExists)
        {
            throw new InvalidOperationException(
                "Employee details already exist.");
        }

        var detail = new EmployeeDetail(
            request.EmployeeId,
            request.Cnic,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Gender);

        await _dbContext.EmployeeDetails.AddAsync(
            detail,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return detail.Id;
    }
}