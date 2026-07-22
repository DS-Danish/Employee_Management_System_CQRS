using EmployeeManagement.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Application.EmployeeDetails.Commands.DeleteEmployeeDetail;

public sealed class DeleteEmployeeDetailHandler
    : IRequestHandler<DeleteEmployeeDetail, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public DeleteEmployeeDetailHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(
        DeleteEmployeeDetail request,
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

        _dbContext.EmployeeDetails.Remove(detail);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}