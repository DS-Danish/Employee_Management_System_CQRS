using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeProjects.Commands.AssignEmployeeToProject;

public sealed class AssignEmployeeToProjectHandler
    : IRequestHandler<AssignEmployeeToProject, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public AssignEmployeeToProjectHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        AssignEmployeeToProject request,
        CancellationToken cancellationToken)
    {
        bool employeeExists = await _dbContext.Employees
            .AnyAsync(
                x => x.Id == request.EmployeeId,
                cancellationToken);

        bool projectExists = await _dbContext.Projects
            .AnyAsync(
                x => x.Id == request.ProjectId,
                cancellationToken);

        if (!employeeExists || !projectExists)
        {
            return false;
        }

        bool assignmentExists =
            await _dbContext.EmployeeProjects.AnyAsync(
                x =>
                    x.EmployeeId == request.EmployeeId &&
                    x.ProjectId == request.ProjectId,
                cancellationToken);

        if (assignmentExists)
        {
            return false;
        }

        var assignment = new EmployeeProject(
            request.EmployeeId,
            request.ProjectId);

        await _dbContext.EmployeeProjects.AddAsync(
            assignment,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}