using EmployeeManagement.Application.Common;
using EmployeeManagement.Application.Employees.Commands.CreateEmployee;
using EmployeeManagement.Application.Employees.Commands.DeleteEmployee;
using EmployeeManagement.Application.Employees.Commands.UpdateEmployee;
using EmployeeManagement.Application.Employees.DTOs;
using EmployeeManagement.Application.Employees.Queries.GetEmployeeById;
using EmployeeManagement.Application.Employees.Queries.GetEmployees;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/employees")]
public sealed class EmployeesController : ControllerBase
{
    private readonly ISender _sender;

    public EmployeesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create(
        CreateEmployee command,
        CancellationToken cancellationToken)
    {
        Guid id = await _sender.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            id);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<EmployeeListItemDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetEmployeesQuery(search, pageNumber, pageSize),
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EmployeeDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        EmployeeDto? employee = await _sender.Send(
            new GetEmployeeByIdQuery(id),
            cancellationToken);

        if (employee is null)
        {
            return NotFound();
        }

        return Ok(employee);
    }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(
            Guid id,
            UpdateEmployeeRequest request,
            CancellationToken cancellationToken)
        {   
            var command = new UpdateEmployee(
                id,
                request.FirstName,
                request.LastName,
                request.Email,
                request.Street,
                request.City,
                request.Country,
                request.PostalCode,
                request.DepartmentId);

            bool updated = await _sender.Send(
                command,
                cancellationToken);

        return updated ? NoContent() : NotFound();
        }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        bool deleted = await _sender.Send(
            new DeleteEmployee(id),
            cancellationToken);

        return deleted ? NoContent() : NotFound();
    }
}

public sealed record UpdateEmployeeRequest(
    string FirstName,
    string LastName,
    string Email,
    string Street,
    string City,
    string Country,
    string PostalCode,
    Guid? DepartmentId);