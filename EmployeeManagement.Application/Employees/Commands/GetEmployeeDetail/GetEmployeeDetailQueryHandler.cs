using EmployeeManagement.Application.Abstractions;
using EmployeeManagement.Application.EmployeeDetails.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeDetails.Queries.GetEmployeeDetail;

public sealed class GetEmployeeDetailQueryHandler
    : IRequestHandler<
        GetEmployeeDetailQuery,
        EmployeeDetailDto?>
{
    private readonly IApplicationDbContext _dbContext;

    public GetEmployeeDetailQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<EmployeeDetailDto?> Handle(
        GetEmployeeDetailQuery request,
        CancellationToken cancellationToken)
    {
        return await _dbContext.EmployeeDetails
            .AsNoTracking()
            .Where(detail =>
                detail.EmployeeId == request.EmployeeId)

            .Select(detail => new EmployeeDetailDto(
                detail.Id,
                detail.EmployeeId,
                detail.Cnic,
                detail.PhoneNumber,
                detail.DateOfBirth,
                detail.Gender,
                detail.CreatedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);
    }
}