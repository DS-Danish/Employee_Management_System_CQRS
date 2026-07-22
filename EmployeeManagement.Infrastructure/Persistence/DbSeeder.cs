using Bogus;
using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken = default)
    {
        await SeedDepartmentsAsync(context, cancellationToken);
        await SeedProjectsAsync(context, cancellationToken);
        await SeedEmployeesAsync(context, cancellationToken);
        await SeedEmployeeDetailsAsync(context, cancellationToken);
        await SeedEmployeeProjectsAsync(context, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedDepartmentsAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        int existingCount = await context.Departments
            .CountAsync(cancellationToken);

        int recordsToCreate = 20 - existingCount;

        if (recordsToCreate <= 0)
        {
            return;
        }

        var faker = new Faker<Department>()
            .CustomInstantiator(f =>
            {
                string uniqueName =
                    $"{f.Commerce.Department()}-{Guid.NewGuid():N}";

                return new Department(uniqueName[..Math.Min(100, uniqueName.Length)]);
            });

        List<Department> departments = faker.Generate(recordsToCreate);

        await context.Departments.AddRangeAsync(
            departments,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedProjectsAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        int existingCount = await context.Projects
            .CountAsync(cancellationToken);

        int recordsToCreate = 20 - existingCount;

        if (recordsToCreate <= 0)
        {
            return;
        }

        var faker = new Faker<Project>()
            .CustomInstantiator(f =>
            {
                DateTime startDate = f.Date.Past(2);

                DateTime? endDate = f.Random.Bool()
                    ? f.Date.Future(1, startDate)
                    : null;

                string uniqueName =
                    $"{f.Commerce.ProductName()}-{Guid.NewGuid():N}";

                string projectName =
                    uniqueName[..Math.Min(150, uniqueName.Length)];

                return new Project(
                    projectName,
                    f.Lorem.Sentence(),
                    startDate,
                    endDate);
            });

        List<Project> projects = faker.Generate(recordsToCreate);

        await context.Projects.AddRangeAsync(
            projects,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedEmployeesAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        int existingCount = await context.Employees
            .CountAsync(cancellationToken);

        int recordsToCreate = 20 - existingCount;

        if (recordsToCreate <= 0)
        {
            return;
        }

        var faker = new Faker<Employee>()
            .CustomInstantiator(f =>
                new Employee(
                    f.Name.FirstName(),
                    f.Name.LastName(),
                    f.Internet.Email(),
                    new Address(
                        f.Address.StreetAddress(),
                        f.Address.City(),
                        "Pakistan",
                        f.Address.ZipCode())));

        List<Employee> employees = faker.Generate(recordsToCreate);

        await context.Employees.AddRangeAsync(
            employees,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedEmployeeDetailsAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        List<Guid> employeeIdsWithoutDetails =
            await context.Employees
                .Where(employee =>
                    !context.EmployeeDetails.Any(detail =>
                        detail.EmployeeId == employee.Id))
                .Select(employee => employee.Id)
                .Take(20)
                .ToListAsync(cancellationToken);

        if (employeeIdsWithoutDetails.Count == 0)
        {
            return;
        }

        var faker = new Faker();

        List<EmployeeDetail> details = employeeIdsWithoutDetails
            .Select(employeeId =>
                new EmployeeDetail(
                    employeeId,
                    faker.Random.Replace("#####-#######-#"),
                    faker.Phone.PhoneNumber(),
                    faker.Date.Past(
                        30,
                        DateTime.Today.AddYears(-18)),
                    faker.PickRandom("Male", "Female")))
            .ToList();

        await context.EmployeeDetails.AddRangeAsync(
            details,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedEmployeeProjectsAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        int existingCount = await context.EmployeeProjects
            .CountAsync(cancellationToken);

        int recordsToCreate = 20 - existingCount;

        if (recordsToCreate <= 0)
        {
            return;
        }

        List<Guid> employeeIds = await context.Employees
            .Select(employee => employee.Id)
            .ToListAsync(cancellationToken);

        List<Guid> projectIds = await context.Projects
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);

        if (employeeIds.Count == 0 || projectIds.Count == 0)
        {
            return;
        }

        var existingAssignments = await context.EmployeeProjects
            .Select(employeeProject => new
            {
                employeeProject.EmployeeId,
                employeeProject.ProjectId
            })
            .ToListAsync(cancellationToken);

        HashSet<string> usedAssignments = existingAssignments
            .Select(assignment =>
                $"{assignment.EmployeeId}:{assignment.ProjectId}")
            .ToHashSet();

        var faker = new Faker();
        var employeeProjects = new List<EmployeeProject>();

        int maximumPossibleAssignments =
            employeeIds.Count * projectIds.Count;

        int maximumAssignmentsToCreate = Math.Min(
            recordsToCreate,
            maximumPossibleAssignments - usedAssignments.Count);

        while (employeeProjects.Count < maximumAssignmentsToCreate)
        {
            Guid employeeId = faker.PickRandom(employeeIds);
            Guid projectId = faker.PickRandom(projectIds);

            string assignmentKey = $"{employeeId}:{projectId}";

            if (!usedAssignments.Add(assignmentKey))
            {
                continue;
            }

            employeeProjects.Add(
                new EmployeeProject(employeeId, projectId));
        }

        if (employeeProjects.Count == 0)
        {
            return;
        }

        await context.EmployeeProjects.AddRangeAsync(
            employeeProjects,
            cancellationToken);
    }
}