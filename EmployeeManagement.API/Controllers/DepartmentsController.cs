using EmployeeManagement.Application.Departments.Commands.CreateDepartment;
using EmployeeManagement.Application.Departments.Commands.DeleteDepartment;
using EmployeeManagement.Application.Departments.Commands.UpdateDepartment;
using EmployeeManagement.Application.Departments.DTOs;
using EmployeeManagement.Application.Departments.Queries.GetDepartmentById;
using EmployeeManagement.Application.Departments.Queries.GetDepartments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/departments")]
public sealed class DepartmentsController : ControllerBase
{
    private readonly ISender _sender;

    public DepartmentsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create(
        CreateDepartment command,
        CancellationToken cancellationToken)
    {
        Guid id = await _sender.Send(
            command,
            cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            id);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DepartmentDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<DepartmentDto> departments =
            await _sender.Send(
                new GetDepartmentsQuery(),
                cancellationToken);

        return Ok(departments);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DepartmentDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        DepartmentDto? department =
            await _sender.Send(
                new GetDepartmentByIdQuery(id),
                cancellationToken);

        if (department is null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        return Ok(department);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateDepartmentRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateDepartment(
            id,
            request.Name);

        bool updated = await _sender.Send(
            command,
            cancellationToken);

        if (!updated)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        bool deleted = await _sender.Send(
            new DeleteDepartment(id),
            cancellationToken);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        return NoContent();
    }
}

public sealed record UpdateDepartmentRequest(
    string Name);