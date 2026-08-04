using EmployeeManagement.Domain.Entities;
using EmployeeManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using EmployeeManagement.Application.Common.Constants;

namespace EmployeeManagement.Infrastructure.Identity;

public static class DbSeeder
{
    private const string DevelopmentEmployeePassword =
        "12345";

    private const string SuperAdminEmail =
        "superadmin@ems.com";

    private const string SuperAdminPassword =
        "SuperAdmin@123";

    private const string SuperAdminFullName =
        "System Super Admin";

    /*
     * This existing employee will become the Team Lead.
     * Change this email if employee2@ems.com does not exist.
     */
    private const string TeamLeadEmail =
        "employee2@ems.com";

    public static async Task SeedAsync(
        IServiceProvider serviceProvider)
    {
        using IServiceScope scope =
            serviceProvider.CreateScope();

        ApplicationDbContext dbContext =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        RoleManager<IdentityRole> roleManager =
            scope.ServiceProvider
                .GetRequiredService<RoleManager<IdentityRole>>();

        UserManager<ApplicationUser> userManager =
            scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();

        /*
         * Apply any outstanding EF Core migrations first.
         *
         * This is important because Permissions and
         * UserPermissions must exist before permissions
         * can be seeded.
         */
        await dbContext.Database.MigrateAsync();

        await SeedRolesAsync(
            roleManager);

        await SeedPermissionsAsync(
            dbContext);

        await SeedTeamLeadRelationshipAsync(
            dbContext);

        await SeedEmployeeUsersAsync(
            dbContext,
            userManager);

        await SeedTeamLeadRoleAsync(
            userManager);

        await SeedSuperAdminAsync(
            userManager);
    }

    private static async Task SeedRolesAsync(
        RoleManager<IdentityRole> roleManager)
    {
        foreach (
            string roleName
            in AppRoles.All)
        {
            bool roleExists =
                await roleManager.RoleExistsAsync(
                    roleName);

            if (roleExists)
            {
                continue;
            }

            IdentityRole role =
                new(roleName);

            IdentityResult result =
                await roleManager.CreateAsync(
                    role);

            EnsureSucceeded(
                result,
                $"Failed to create role '{roleName}'.");
        }
    }

    private static async Task SeedPermissionsAsync(
        ApplicationDbContext dbContext)
    {
        foreach (
            PermissionDefinition definition
            in AppPermissions.All)
        {
            Permission? permission =
                await dbContext
                    .Permissions
                    .FirstOrDefaultAsync(
                        existingPermission =>
                            existingPermission.Code ==
                            definition.Code);

            if (permission is null)
            {
                dbContext.Permissions.Add(
                    new Permission
                    {
                        Name =
                            definition.Name,

                        Code =
                            definition.Code
                    });

                continue;
            }

            /*
             * Keep the human-readable name in sync
             * if AppPermissions is changed later.
             */
            if (permission.Name != definition.Name)
            {
                permission.Name =
                    definition.Name;
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedTeamLeadRelationshipAsync(
        ApplicationDbContext dbContext)
    {
        string normalizedTeamLeadEmail =
            TeamLeadEmail
                .Trim()
                .ToLowerInvariant();

        Employee? teamLead =
            await dbContext.Employees
                .FirstOrDefaultAsync(
                    employee =>
                        employee.Email.ToLower() ==
                        normalizedTeamLeadEmail);

        if (teamLead is null)
        {
            Console.WriteLine(
                $"Team Lead employee '{TeamLeadEmail}' was not found.");

            Console.WriteLine(
                "Change TeamLeadEmail in DbSeeder.cs to an existing " +
                "employee email.");

            return;
        }

        List<Employee> employees =
            await dbContext.Employees
                .Where(
                    employee =>
                        employee.Id != teamLead.Id)
                .ToListAsync();

        bool changesMade = false;

        foreach (
            Employee employee
            in employees)
        {
            if (
                employee.TeamLeadId ==
                teamLead.Id)
            {
                continue;
            }

            employee.AssignTeamLead(
                teamLead.Id);

            changesMade = true;
        }

        /*
         * The Team Lead should not report
         * to themselves or another employee.
         */
        if (teamLead.TeamLeadId is not null)
        {
            teamLead.RemoveTeamLead();

            changesMade = true;
        }

        if (changesMade)
        {
            await dbContext.SaveChangesAsync();
        }
    }

    private static async Task SeedEmployeeUsersAsync(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        List<Employee> employees =
            await dbContext.Employees
                .AsNoTracking()
                .ToListAsync();

        foreach (
            Employee employee
            in employees)
        {
            if (
                string.IsNullOrWhiteSpace(
                    employee.Email))
            {
                continue;
            }

            string email =
                employee.Email
                    .Trim()
                    .ToLowerInvariant();

            ApplicationUser? user =
                await userManager
                    .FindByEmailAsync(
                        email);

            if (user is null)
            {
                user =
                    new ApplicationUser
                    {
                        UserName =
                            email,

                        Email =
                            email,

                        EmailConfirmed =
                            true,

                        FullName =
                            $"{employee.FirstName} {employee.LastName}"
                                .Trim(),

                        EmployeeId =
                            employee.Id,

                        DepartmentId =
                            employee.DepartmentId
                    };

                IdentityResult createResult =
                    await userManager
                        .CreateAsync(
                            user,
                            DevelopmentEmployeePassword);

                EnsureSucceeded(
                    createResult,
                    $"Failed to create employee user '{email}'.");
            }
            else
            {
                bool requiresUpdate =
                    false;

                string expectedFullName =
                    $"{employee.FirstName} {employee.LastName}"
                        .Trim();

                if (
                    user.FullName !=
                    expectedFullName)
                {
                    user.FullName =
                        expectedFullName;

                    requiresUpdate =
                        true;
                }

                if (
                    user.EmployeeId !=
                    employee.Id)
                {
                    user.EmployeeId =
                        employee.Id;

                    requiresUpdate =
                        true;
                }

                if (
                    user.DepartmentId !=
                    employee.DepartmentId)
                {
                    user.DepartmentId =
                        employee.DepartmentId;

                    requiresUpdate =
                        true;
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed =
                        true;

                    requiresUpdate =
                        true;
                }

                if (requiresUpdate)
                {
                    IdentityResult updateResult =
                        await userManager
                            .UpdateAsync(
                                user);

                    EnsureSucceeded(
                        updateResult,
                        $"Failed to update employee user '{email}'.");
                }
            }

            await AddRoleIfMissingAsync(
                userManager,
                user,
                AppRoles.Employee);
        }
    }

    private static async Task SeedTeamLeadRoleAsync(
        UserManager<ApplicationUser> userManager)
    {
        ApplicationUser? teamLead =
            await userManager
                .FindByEmailAsync(
                    TeamLeadEmail);

        if (teamLead is null)
        {
            Console.WriteLine(
                $"Team Lead user '{TeamLeadEmail}' was not found.");

            return;
        }

        if (teamLead.EmployeeId is null)
        {
            Console.WriteLine(
                $"User '{TeamLeadEmail}' is not linked to an employee.");

            return;
        }

        /*
         * A Team Lead is still an Employee,
         * therefore both roles are assigned.
         */
        await AddRoleIfMissingAsync(
            userManager,
            teamLead,
            AppRoles.Employee);

        await AddRoleIfMissingAsync(
            userManager,
            teamLead,
            AppRoles.TeamLead);
    }

    private static async Task SeedSuperAdminAsync(
        UserManager<ApplicationUser> userManager)
    {
        ApplicationUser? superAdmin =
            await userManager
                .FindByEmailAsync(
                    SuperAdminEmail);

        if (superAdmin is null)
        {
            superAdmin =
                new ApplicationUser
                {
                    UserName =
                        SuperAdminEmail,

                    Email =
                        SuperAdminEmail,

                    EmailConfirmed =
                        true,

                    FullName =
                        SuperAdminFullName,

                    EmployeeId =
                        null,

                    DepartmentId =
                        null
                };

            IdentityResult createResult =
                await userManager
                    .CreateAsync(
                        superAdmin,
                        SuperAdminPassword);

            EnsureSucceeded(
                createResult,
                $"Failed to create Super Admin '{SuperAdminEmail}'.");
        }
        else
        {
            bool requiresUpdate =
                false;

            if (
                superAdmin.FullName !=
                SuperAdminFullName)
            {
                superAdmin.FullName =
                    SuperAdminFullName;

                requiresUpdate =
                    true;
            }

            if (
                superAdmin.EmployeeId
                is not null)
            {
                superAdmin.EmployeeId =
                    null;

                requiresUpdate =
                    true;
            }

            if (
                superAdmin.DepartmentId
                is not null)
            {
                superAdmin.DepartmentId =
                    null;

                requiresUpdate =
                    true;
            }

            if (!superAdmin.EmailConfirmed)
            {
                superAdmin.EmailConfirmed =
                    true;

                requiresUpdate =
                    true;
            }

            if (requiresUpdate)
            {
                IdentityResult updateResult =
                    await userManager
                        .UpdateAsync(
                            superAdmin);

                EnsureSucceeded(
                    updateResult,
                    "Failed to update the Super Admin account.");
            }
        }

        /*
         * SuperAdmin should only require
         * the SuperAdmin role.
         */
        IList<string> currentRoles =
            await userManager
                .GetRolesAsync(
                    superAdmin);

        string[] rolesToRemove =
            currentRoles
                .Where(
                    role =>
                        !string.Equals(
                            role,
                            AppRoles.SuperAdmin,
                            StringComparison
                                .OrdinalIgnoreCase))
                .ToArray();

        if (rolesToRemove.Length > 0)
        {
            IdentityResult removeResult =
                await userManager
                    .RemoveFromRolesAsync(
                        superAdmin,
                        rolesToRemove);

            EnsureSucceeded(
                removeResult,
                "Failed to remove incorrect roles from Super Admin.");
        }

        await AddRoleIfMissingAsync(
            userManager,
            superAdmin,
            AppRoles.SuperAdmin);
    }

    private static async Task AddRoleIfMissingAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationUser user,
        string roleName)
    {
        bool isAlreadyInRole =
            await userManager
                .IsInRoleAsync(
                    user,
                    roleName);

        if (isAlreadyInRole)
        {
            return;
        }

        IdentityResult result =
            await userManager
                .AddToRoleAsync(
                    user,
                    roleName);

        EnsureSucceeded(
            result,
            $"Failed to assign role '{roleName}' " +
            $"to user '{user.Email}'.");
    }

    private static void EnsureSucceeded(
        IdentityResult result,
        string message)
    {
        if (result.Succeeded)
        {
            return;
        }

        string errors =
            string.Join(
                Environment.NewLine,
                result.Errors.Select(
                    error =>
                        $"{error.Code}: {error.Description}"));

        throw new InvalidOperationException(
            $"{message}{Environment.NewLine}{errors}");
    }
}