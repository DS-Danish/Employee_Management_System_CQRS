using EmployeeManagement.Application.EmployeeDetails.Commands.CreateEmployeeDetail;
using EmployeeManagement.Application.EmployeeDetails.Commands.DeleteEmployeeDetail;
using EmployeeManagement.Application.EmployeeDetails.Commands.UpdateEmployeeDetail;
using EmployeeManagement.Application.EmployeeDetails.DTOs;
using EmployeeManagement.Application.EmployeeDetails.Queries.GetEmployeeDetail;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/employees/{employeeId:guid}/details")]
public sealed class EmployeeDetailsController : ControllerBase
{
    private readonly ISender _sender;

    public EmployeeDetailsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create(
        Guid employeeId,
        CreateEmployeeDetailRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateEmployeeDetail(
            employeeId,
            request.Cnic,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Gender);

        Guid id = await _sender.Send(
            command,
            cancellationToken);

        return CreatedAtAction(
            nameof(Get),
            new { employeeId },
            id);
    }

    [HttpGet]
    public async Task<ActionResult<EmployeeDetailDto>> Get(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        EmployeeDetailDto? detail =
            await _sender.Send(
                new GetEmployeeDetailQuery(employeeId),
                cancellationToken);

        if (detail is null)
        {
            return NotFound(new
            {
                message = "Employee details not found."
            });
        }

        return Ok(detail);
    }

    [HttpPut]
    public async Task<IActionResult> Update(
        Guid employeeId,
        UpdateEmployeeDetailRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateEmployeeDetail(
            employeeId,
            request.Cnic,
            request.PhoneNumber,
            request.DateOfBirth,
            request.Gender);

        bool updated = await _sender.Send(
            command,
            cancellationToken);

        if (!updated)
        {
            return NotFound(new
            {
                message = "Employee details not found."
            });
        }

        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        bool deleted = await _sender.Send(
            new DeleteEmployeeDetail(employeeId),
            cancellationToken);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Employee details not found."
            });
        }

        return NoContent();
    }
}

public sealed record CreateEmployeeDetailRequest(
    string Cnic,
    string PhoneNumber,
    DateTime DateOfBirth,
    string Gender);

public sealed record UpdateEmployeeDetailRequest(
    string Cnic,
    string PhoneNumber,
    DateTime DateOfBirth,
    string Gender);