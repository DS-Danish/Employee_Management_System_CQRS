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

    private const string TeamLeadEmail =
        "ali.khan@example.com";

    private const string SuperAdminEmail =
        "superadmin@gmail.com";

    private const string SuperAdminPassword =
        "12345";

    private const string SuperAdminFullName =
        "System Super Admin";

    private const string ObsoleteAdminRole =
        "Admin";

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

        await dbContext.Database.MigrateAsync();

        Console.WriteLine(
            "Starting database seeding.");

        await SeedRolesAsync(
            roleManager);

        await MigrateAdminRoleAsync(
            userManager,
            roleManager);

        await SeedEmployeeUsersAsync(
            dbContext,
            userManager);

        await SeedTeamLeadRelationshipAsync(
            dbContext);

        await SeedTeamLeadRoleAsync(
            userManager);

        await SeedSuperAdminAsync(
            userManager);

        Console.WriteLine(
            "Database seeding completed.");
    }

    private static async Task SeedRolesAsync(
        RoleManager<IdentityRole> roleManager)
    {
        foreach (string roleName in AppRoles.All)
        {
            if (await roleManager.RoleExistsAsync(
                    roleName))
            {
                continue;
            }

            IdentityResult result =
                await roleManager.CreateAsync(
                    new IdentityRole(roleName));

            EnsureSucceeded(
                result,
                $"Failed to create role '{roleName}'.");

            Console.WriteLine(
                $"Created role: {roleName}");
        }
    }

    private static async Task MigrateAdminRoleAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        bool obsoleteRoleExists =
            await roleManager.RoleExistsAsync(
                ObsoleteAdminRole);

        if (!obsoleteRoleExists)
        {
            return;
        }

        IList<ApplicationUser> adminUsers =
            await userManager.GetUsersInRoleAsync(
                ObsoleteAdminRole);

        foreach (ApplicationUser user in adminUsers)
        {
            bool hasTeamLeadRole =
                await userManager.IsInRoleAsync(
                    user,
                    AppRoles.TeamLead);

            if (!hasTeamLeadRole)
            {
                IdentityResult addTeamLeadResult =
                    await userManager.AddToRoleAsync(
                        user,
                        AppRoles.TeamLead);

                EnsureSucceeded(
                    addTeamLeadResult,
                    $"Failed to assign role '{AppRoles.TeamLead}' " +
                    $"to '{user.Email}'.");
            }

            bool hasEmployeeRole =
                await userManager.IsInRoleAsync(
                    user,
                    AppRoles.Employee);

            if (user.EmployeeId.HasValue &&
                !hasEmployeeRole)
            {
                IdentityResult addEmployeeResult =
                    await userManager.AddToRoleAsync(
                        user,
                        AppRoles.Employee);

                EnsureSucceeded(
                    addEmployeeResult,
                    $"Failed to assign role '{AppRoles.Employee}' " +
                    $"to '{user.Email}'.");
            }

            IdentityResult removeAdminResult =
                await userManager.RemoveFromRoleAsync(
                    user,
                    ObsoleteAdminRole);

            EnsureSucceeded(
                removeAdminResult,
                $"Failed to remove obsolete role " +
                $"'{ObsoleteAdminRole}' from '{user.Email}'.");

            Console.WriteLine(
                $"Migrated '{user.Email}' from " +
                $"'{ObsoleteAdminRole}' to '{AppRoles.TeamLead}'.");
        }

        IdentityRole? obsoleteRole =
            await roleManager.FindByNameAsync(
                ObsoleteAdminRole);

        if (obsoleteRole is null)
        {
            return;
        }

        IdentityResult deleteRoleResult =
            await roleManager.DeleteAsync(
                obsoleteRole);

        EnsureSucceeded(
            deleteRoleResult,
            $"Failed to delete obsolete role " +
            $"'{ObsoleteAdminRole}'.");

        Console.WriteLine(
            $"Deleted obsolete role: {ObsoleteAdminRole}");
    }

    private static async Task SeedEmployeeUsersAsync(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        List<Employee> employees =
            await dbContext.Employees
                .AsNoTracking()
                .ToListAsync();

        foreach (Employee employee in employees)
        {
            if (string.IsNullOrWhiteSpace(
                    employee.Email))
            {
                continue;
            }

            string email =
                employee.Email
                    .Trim()
                    .ToLowerInvariant();

            ApplicationUser? user =
                await FindUserByEmailAsync(
                    userManager,
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
                    await userManager.CreateAsync(
                        user,
                        DevelopmentEmployeePassword);

                EnsureSucceeded(
                    createResult,
                    $"Failed to create employee user '{email}'.");

                Console.WriteLine(
                    $"Created employee user: {email}");
            }
            else
            {
                bool requiresUpdate =
                    false;

                string expectedFullName =
                    $"{employee.FirstName} {employee.LastName}"
                        .Trim();

                if (user.FullName != expectedFullName)
                {
                    user.FullName =
                        expectedFullName;

                    requiresUpdate =
                        true;
                }

                if (user.EmployeeId != employee.Id)
                {
                    user.EmployeeId =
                        employee.Id;

                    requiresUpdate =
                        true;
                }

                if (user.DepartmentId !=
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
                        await userManager.UpdateAsync(
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

    private static async Task SeedTeamLeadRelationshipAsync(
        ApplicationDbContext dbContext)
    {
        string normalizedEmail =
            TeamLeadEmail
                .Trim()
                .ToLowerInvariant();

        Employee? teamLead =
            await dbContext.Employees
                .FirstOrDefaultAsync(
                    employee =>
                        employee.Email.ToLower() ==
                        normalizedEmail);

        if (teamLead is null)
        {
            Console.WriteLine(
                $"Team Lead employee not found: " +
                $"{TeamLeadEmail}");

            return;
        }

        List<Employee> employees =
            await dbContext.Employees
                .Where(
                    employee =>
                        employee.Id != teamLead.Id)
                .ToListAsync();

        foreach (Employee employee in employees)
        {
            if (employee.TeamLeadId ==
                teamLead.Id)
            {
                continue;
            }

            employee.AssignTeamLead(
                teamLead.Id);
        }

        if (teamLead.TeamLeadId is not null)
        {
            teamLead.RemoveTeamLead();
        }

        await dbContext.SaveChangesAsync();

        Console.WriteLine(
            $"Assigned {employees.Count} employees to Team Lead " +
            $"'{TeamLeadEmail}'.");
    }

    private static async Task SeedTeamLeadRoleAsync(
        UserManager<ApplicationUser> userManager)
    {
        ApplicationUser? teamLead =
            await FindUserByEmailAsync(
                userManager,
                TeamLeadEmail);

        if (teamLead is null)
        {
            Console.WriteLine(
                $"Team Lead user not found: " +
                $"{TeamLeadEmail}");

            return;
        }

        if (teamLead.EmployeeId is null)
        {
            Console.WriteLine(
                $"Team Lead user '{TeamLeadEmail}' is not linked " +
                "to an employee.");

            return;
        }

        await AddRoleIfMissingAsync(
            userManager,
            teamLead,
            AppRoles.Employee);

        await AddRoleIfMissingAsync(
            userManager,
            teamLead,
            AppRoles.TeamLead);

        Console.WriteLine(
            $"Team Lead role assigned to: " +
            $"{TeamLeadEmail}");
    }

    private static async Task SeedSuperAdminAsync(
        UserManager<ApplicationUser> userManager)
    {
        string normalizedEmail =
            SuperAdminEmail
                .Trim()
                .ToLowerInvariant();

        ApplicationUser? superAdmin =
            await FindUserByEmailAsync(
                userManager,
                normalizedEmail);

        if (superAdmin is null)
        {
            superAdmin =
                new ApplicationUser
                {
                    UserName =
                        normalizedEmail,

                    Email =
                        normalizedEmail,

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
                await userManager.CreateAsync(
                    superAdmin,
                    SuperAdminPassword);

            EnsureSucceeded(
                createResult,
                $"Failed to create Super Admin " +
                $"'{SuperAdminEmail}'.");

            Console.WriteLine(
                $"Created Super Admin: " +
                $"{SuperAdminEmail}");
        }
        else
        {
            bool requiresUpdate =
                false;

            if (superAdmin.FullName !=
                SuperAdminFullName)
            {
                superAdmin.FullName =
                    SuperAdminFullName;

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

            if (superAdmin.EmployeeId is not null)
            {
                superAdmin.EmployeeId =
                    null;

                requiresUpdate =
                    true;
            }

            if (superAdmin.DepartmentId is not null)
            {
                superAdmin.DepartmentId =
                    null;

                requiresUpdate =
                    true;
            }

            if (requiresUpdate)
            {
                IdentityResult updateResult =
                    await userManager.UpdateAsync(
                        superAdmin);

                EnsureSucceeded(
                    updateResult,
                    $"Failed to update Super Admin " +
                    $"'{SuperAdminEmail}'.");
            }
        }

        await AddRoleIfMissingAsync(
            userManager,
            superAdmin,
            AppRoles.SuperAdmin);

        await RemoveRoleIfPresentAsync(
            userManager,
            superAdmin,
            AppRoles.Employee);

        await RemoveRoleIfPresentAsync(
            userManager,
            superAdmin,
            AppRoles.TeamLead);
    }

    private static async Task<ApplicationUser?>
        FindUserByEmailAsync(
            UserManager<ApplicationUser> userManager,
            string email)
    {
        string normalizedEmail =
            userManager.NormalizeEmail(
                email.Trim());

        return await userManager.Users
            .FirstOrDefaultAsync(
                user =>
                    user.NormalizedEmail ==
                    normalizedEmail);
    }

    private static async Task AddRoleIfMissingAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationUser user,
        string roleName)
    {
        bool hasRole =
            await userManager.IsInRoleAsync(
                user,
                roleName);

        if (hasRole)
        {
            return;
        }

        IdentityResult result =
            await userManager.AddToRoleAsync(
                user,
                roleName);

        EnsureSucceeded(
            result,
            $"Failed to assign role '{roleName}' " +
            $"to '{user.Email}'.");

        Console.WriteLine(
            $"Assigned role '{roleName}' to " +
            $"'{user.Email}'.");
    }

    private static async Task RemoveRoleIfPresentAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationUser user,
        string roleName)
    {
        bool hasRole =
            await userManager.IsInRoleAsync(
                user,
                roleName);

        if (!hasRole)
        {
            return;
        }

        IdentityResult result =
            await userManager.RemoveFromRoleAsync(
                user,
                roleName);

        EnsureSucceeded(
            result,
            $"Failed to remove role '{roleName}' " +
            $"from '{user.Email}'.");

        Console.WriteLine(
            $"Removed role '{roleName}' from " +
            $"'{user.Email}'.");
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
                        $"{error.Code}: " +
                        $"{error.Description}"));

        throw new InvalidOperationException(
            $"{message}" +
            $"{Environment.NewLine}" +
            $"{errors}");
    }
}