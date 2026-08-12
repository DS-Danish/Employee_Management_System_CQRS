using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.EmployeeProjects.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeProjects
    .Queries.GetProjectEmployees;

public sealed class GetProjectEmployeesQueryHandler
    : IRequestHandler<
        GetProjectEmployeesQuery,
        IReadOnlyList<ProjectEmployeeDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetProjectEmployeesQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ProjectEmployeeDto>> Handle(
        GetProjectEmployeesQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.EmployeeProjects
            .AsNoTracking()
            .Where(
                x =>
                    x.ProjectId ==
                    request.ProjectId)
            .OrderBy(
                x =>
                    x.Employee.FirstName)
            .ThenBy(
                x =>
                    x.Employee.LastName)
            .Select(
                x =>
                    new ProjectEmployeeDto(
                        x.EmployeeId,
                        x.Employee.FirstName +
                        " " +
                        x.Employee.LastName,
                        x.Employee.Email))
            .ToListAsync(
                cancellationToken);
    }
}