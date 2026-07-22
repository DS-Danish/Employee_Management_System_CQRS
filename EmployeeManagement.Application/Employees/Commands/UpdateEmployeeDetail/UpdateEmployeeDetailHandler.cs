using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.UpdateEmployeeDetail;

public sealed class UpdateEmployeeDetailHandler
    : IRequestHandler<UpdateEmployeeDetail, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdateEmployeeDetailHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        UpdateEmployeeDetail request,
        CancellationToken cancellationToken)
    {
        var detail = await _dbContext.EmployeeDetails
            .FirstOrDefaultAsync(
                x => x.EmployeeId == request.EmployeeId,
                cancellationToken);

        if (detail is null)
        {
            return false;
        }

        detail.Update(
            request.Cnic,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Gender);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}