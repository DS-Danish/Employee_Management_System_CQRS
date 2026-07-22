using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.Departments.Commands.CreateDepartment;

public sealed class CreateDepartmentHandler
    : IRequestHandler<CreateDepartment, Guid>
{
    private readonly IApplicationDbContext _dbContext;

    public CreateDepartmentHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(
        CreateDepartment request,
        CancellationToken cancellationToken)
    {
        bool exists = await _dbContext.Departments
            .AnyAsync(
                x => x.Name == request.Name,
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "A department with this name already exists.");
        }

        var department = new Department(request.Name);

        await _dbContext.Departments.AddAsync(
            department,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return department.Id;
    }
}