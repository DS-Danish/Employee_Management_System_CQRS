using EmployeeManagement.Application.Common.Constants;
using EmployeeManagement.Domain.Entities;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EmployeeManagement.Infrastructure.Identity;

public static class DbSeeder
{
    private const string DevelopmentPassword =
        "12345";

    public static async Task SeedAsync(
        IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(
            serviceProvider);

        using IServiceScope scope =
            serviceProvider.CreateScope();

        IServiceProvider services =
            scope.ServiceProvider;

        RoleManager<IdentityRole> roleManager =
            services.GetRequiredService<
                RoleManager<IdentityRole>>();

        UserManager<ApplicationUser> userManager =
            services.GetRequiredService<
                UserManager<ApplicationUser>>();

        ApplicationDbContext databaseContext =
            services.GetRequiredService<
                ApplicationDbContext>();

        await SeedRolesAsync(roleManager);

        await SeedEmployeeUsersAsync(
            databaseContext,
            userManager);
    }

    private static async Task SeedRolesAsync(
        RoleManager<IdentityRole> roleManager)
    {
        foreach (string roleName in AppRoles.All)
        {
            bool roleExists =
                await roleManager.RoleExistsAsync(
                    roleName);

            if (roleExists)
            {
                continue;
            }

            IdentityResult result =
                await roleManager.CreateAsync(
                    new IdentityRole(roleName));

            EnsureSucceeded(
                result,
                $"creating role '{roleName}'");
        }
    }

    private static async Task SeedEmployeeUsersAsync(
        ApplicationDbContext databaseContext,
        UserManager<ApplicationUser> userManager)
    {
        List<Employee> employees =
            await databaseContext.Employees
                .AsNoTracking()
                .OrderBy(
                    employee =>
                        employee.CreatedAtUtc)
                .Take(20)
                .ToListAsync();

        foreach (Employee employee in employees)
        {
            ApplicationUser? linkedUser =
                await userManager.Users
                    .FirstOrDefaultAsync(
                        user =>
                            user.EmployeeId ==
                            employee.Id);

            if (linkedUser is not null)
            {
                await UpdateLinkedUserAsync(
                    userManager,
                    linkedUser,
                    employee);

                await EnsureEmployeeRoleAsync(
                    userManager,
                    linkedUser);

                continue;
            }

            string email =
                GetEmployeeEmail(employee);

            ApplicationUser? emailUser =
                await userManager.FindByEmailAsync(
                    email);

            if (emailUser is not null)
            {
                emailUser.FullName =
                    GetEmployeeFullName(employee);

                emailUser.EmployeeId =
                    employee.Id;

                emailUser.DepartmentId =
                    employee.DepartmentId;

                emailUser.EmailConfirmed =
                    true;

                IdentityResult updateResult =
                    await userManager.UpdateAsync(
                        emailUser);

                EnsureSucceeded(
                    updateResult,
                    $"linking employee '{employee.Id}'");

                await EnsureEmployeeRoleAsync(
                    userManager,
                    emailUser);

                continue;
            }

            var user = new ApplicationUser
            {
                FullName =
                    GetEmployeeFullName(employee),

                UserName =
                    email,

                Email =
                    email,

                EmailConfirmed =
                    true,

                EmployeeId =
                    employee.Id,

                DepartmentId =
                    employee.DepartmentId
            };

            IdentityResult createResult =
                await userManager.CreateAsync(
                    user,
                    DevelopmentPassword);

            EnsureSucceeded(
                createResult,
                $"creating user for employee '{employee.Id}'");

            IdentityResult roleResult =
                await userManager.AddToRoleAsync(
                    user,
                    AppRoles.Employee);

            EnsureSucceeded(
                roleResult,
                $"assigning Employee role to employee '{employee.Id}'");
        }
    }

    private static async Task UpdateLinkedUserAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationUser user,
        Employee employee)
    {
        string email =
            GetEmployeeEmail(employee);

        string fullName =
            GetEmployeeFullName(employee);

        bool hasChanges =
            false;

        if (user.FullName != fullName)
        {
            user.FullName =
                fullName;

            hasChanges =
                true;
        }

        if (user.Email != email)
        {
            user.Email =
                email;

            user.UserName =
                email;

            hasChanges =
                true;
        }

        if (user.DepartmentId !=
            employee.DepartmentId)
        {
            user.DepartmentId =
                employee.DepartmentId;

            hasChanges =
                true;
        }

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed =
                true;

            hasChanges =
                true;
        }

        if (!hasChanges)
        {
            return;
        }

        IdentityResult result =
            await userManager.UpdateAsync(user);

        EnsureSucceeded(
            result,
            $"updating user for employee '{employee.Id}'");
    }

    private static async Task EnsureEmployeeRoleAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationUser user)
    {
        bool hasEmployeeRole =
            await userManager.IsInRoleAsync(
                user,
                AppRoles.Employee);

        if (hasEmployeeRole)
        {
            return;
        }

        IdentityResult result =
            await userManager.AddToRoleAsync(
                user,
                AppRoles.Employee);

        EnsureSucceeded(
            result,
            $"assigning Employee role to user '{user.Email}'");
    }

    private static string GetEmployeeEmail(
        Employee employee)
    {
        if (string.IsNullOrWhiteSpace(
            employee.Email))
        {
            throw new InvalidOperationException(
                $"Employee '{employee.Id}' does not have an email address.");
        }

        return employee.Email
            .Trim()
            .ToLowerInvariant();
    }

    private static string GetEmployeeFullName(
        Employee employee)
    {
        string fullName =
            $"{employee.FirstName} {employee.LastName}"
                .Trim();

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return $"Employee {employee.Id}";
        }

        return fullName;
    }

    private static void EnsureSucceeded(
        IdentityResult result,
        string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        string errors =
            string.Join(
                ", ",
                result.Errors.Select(
                    error =>
                        $"{error.Code}: {error.Description}"));

        throw new InvalidOperationException(
            $"Identity error while {operation}. {errors}");
    }
}