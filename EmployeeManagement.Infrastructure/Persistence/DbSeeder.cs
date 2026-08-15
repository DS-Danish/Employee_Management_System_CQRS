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

    private const int EmployeeCount = 100;

    private static readonly string[] TeamLeadEmails =
    [
        "employee1@ems.com",
        "employee2@ems.com",
        "employee3@ems.com",
        "employee4@ems.com",
        "employee5@ems.com"
    ];

    private static readonly string[] FirstNames =
    [
        "Ahmed", "Hassan", "Usman", "Bilal", "Hamza",
        "Saad", "Talha", "Umar", "Adeel", "Farhan",
        "Ayesha", "Fatima", "Sara", "Hira", "Zainab",
        "Maryam", "Mahnoor", "Iqra", "Sana", "Amna"
    ];

    private static readonly string[] LastNames =
    [
        "Khan", "Ahmed", "Malik", "Raza", "Siddiqui",
        "Qureshi", "Shah", "Sheikh", "Abbasi", "Mirza"
    ];

    private static readonly string[] DepartmentNames =
    [
        "Software Engineering",
        "Human Resources",
        "Finance & Accounts",
        "Sales & Business Development",
        "Operations",
        "Quality Assurance",
        "Customer Support",
        "Administration"
    ];

    private static readonly string[] Cities =
    [
        "Karachi",
        "Lahore",
        "Islamabad",
        "Rawalpindi",
        "Faisalabad",
        "Multan",
        "Hyderabad",
        "Peshawar"
    ];

    private static readonly (string Name, string Description)[] ProjectData =
    [
        ("Employee Self-Service Portal", "Self-service portal for employee profiles, requests and internal services."),
        ("Payroll Automation System", "Automates payroll processing, salary calculations and payroll reporting."),
        ("Attendance & Timesheet Platform", "Centralized attendance, working hours and timesheet management."),
        ("Recruitment Management System", "Tracks vacancies, candidates, interviews and employee onboarding."),
        ("Customer Support Portal", "Manages customer support requests, ownership and resolution workflows."),
        ("Sales Analytics Dashboard", "Provides sales performance, pipeline and revenue analytics."),
        ("Finance Reporting Platform", "Centralizes financial reporting, reconciliation and management summaries."),
        ("Performance Review System", "Supports employee goals, reviews and performance evaluations."),
        ("Document Management Portal", "Organizes internal policies, forms and controlled business documents."),
        ("Learning & Development Portal", "Manages employee training, courses and development plans."),
        ("Asset Tracking System", "Tracks laptops, equipment and other assets assigned to employees."),
        ("Internal Help Desk", "Handles internal IT and administrative service requests."),
        ("Expense Management System", "Manages employee expense submissions, approvals and reimbursements."),
        ("Department KPI Dashboard", "Provides department-level KPIs and operational performance reporting."),
        ("Customer Relationship Integration", "Integrates customer records and business-development workflows."),
        ("Notification Service", "Provides centralized email and application notification delivery."),
        ("Audit & Compliance Tracker", "Tracks audit actions, compliance items and remediation status."),
        ("Project Tracking Portal", "Tracks project ownership, assignments, deadlines and completion status."),
        ("Employee Onboarding Workflow", "Coordinates onboarding tasks across HR, IT and administration."),
        ("Operations Reporting Dashboard", "Provides operational reporting and management visibility.")
    ];

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

        await SeedRolesAsync(roleManager);
        await SeedPermissionsAsync(dbContext);

        if (!await dbContext.Employees.AnyAsync())
        {
            await SeedOrganizationDataAsync(dbContext);
        }

        await SeedEmployeeUsersAsync(
            dbContext,
            userManager);

        await SeedTeamLeadRolesAsync(
            userManager);

        await SeedSuperAdminAsync(
            userManager);

        await SeedLeaveReviewStatusesAsync(
            dbContext,
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

    private static async Task SeedOrganizationDataAsync(
        ApplicationDbContext dbContext)
    {
        List<Department> departments =
            DepartmentNames
                .Select(name => new Department(name))
                .ToList();

        await dbContext.Departments.AddRangeAsync(
            departments);

        await dbContext.SaveChangesAsync();

        List<Employee> employees =
            new();

        for (int index = 0;
             index < EmployeeCount;
             index++)
        {
            string firstName =
                FirstNames[index % FirstNames.Length];

            string lastName =
                LastNames[
                    (index / FirstNames.Length) %
                    LastNames.Length];

            Department department =
                departments[index % departments.Count];

            string city =
                Cities[index % Cities.Length];

            int employeeNumber =
                index + 1;

            Address address =
                new(
                    $"{12 + (index % 88)} {GetStreetName(index)}",
                    city,
                    "Pakistan",
                    GetPostalCode(city));

            Employee employee =
                new(
                    firstName,
                    lastName,
                    $"employee{employeeNumber}@ems.com",
                    address,
                    department.Id);

            employees.Add(employee);
        }

        await dbContext.Employees.AddRangeAsync(
            employees);

        await dbContext.SaveChangesAsync();

        /*
         * The first five employees act as Team Leads.
         * Every other employee is assigned to one of them,
         * so Team Lead dashboards have meaningful team data immediately.
         */
        List<Employee> teamLeads =
            employees
                .Take(TeamLeadEmails.Length)
                .ToList();

        for (int index = TeamLeadEmails.Length;
             index < employees.Count;
             index++)
        {
            Employee teamLead =
                teamLeads[
                    (index - TeamLeadEmails.Length) %
                    teamLeads.Count];

            employees[index].AssignTeamLead(
                teamLead.Id);
        }

        await dbContext.SaveChangesAsync();

        List<EmployeeDetail> employeeDetails =
            new();

        for (int index = 0;
             index < employees.Count;
             index++)
        {
            int employeeNumber =
                index + 1;

            employeeDetails.Add(
                new EmployeeDetail(
                    employees[index].Id,
                    BuildCnic(employeeNumber),
                    BuildPhoneNumber(employeeNumber),
                    BuildDateOfBirth(employeeNumber),
                    employeeNumber % 2 == 0
                        ? "Female"
                        : "Male"));
        }

        await dbContext.EmployeeDetails.AddRangeAsync(
            employeeDetails);

        DateTime today =
            DateTime.UtcNow.Date;

        List<Project> projects =
            new();

        for (int index = 0;
             index < ProjectData.Length;
             index++)
        {
            (string name, string description) =
                ProjectData[index];

            DateTime startDate =
                today.AddDays(
                    -(45 + (index * 9)));

            bool shouldBeCompleted =
                index < 7;

            DateTime? endDate =
                shouldBeCompleted
                    ? today.AddDays(-(5 + index))
                    : today.AddDays(30 + (index * 6));

            Project project =
                new(
                    name,
                    description,
                    startDate,
                    endDate);

            if (shouldBeCompleted)
            {
                project.MarkAsCompleted();
            }

            projects.Add(project);
        }

        await dbContext.Projects.AddRangeAsync(
            projects);

        await dbContext.SaveChangesAsync();

        /*
         * Every employee receives at least one project.
         * Most employees receive two and some receive three.
         * Each employee receives both active and completed work where possible,
         * which makes the employee project charts useful immediately.
         */
        List<EmployeeProject> projectAssignments =
            new();

        HashSet<string> assignmentKeys =
            new(StringComparer.Ordinal);

        for (int employeeIndex = 0;
             employeeIndex < employees.Count;
             employeeIndex++)
        {
            int assignmentCount =
                employeeIndex % 5 == 0
                    ? 3
                    : 2;

            int completedProjectIndex =
                employeeIndex % 7;

            int activeProjectIndex =
                7 + (employeeIndex % 13);

            AddProjectAssignment(
                projectAssignments,
                assignmentKeys,
                employees[employeeIndex],
                projects[completedProjectIndex]);

            AddProjectAssignment(
                projectAssignments,
                assignmentKeys,
                employees[employeeIndex],
                projects[activeProjectIndex]);

            if (assignmentCount == 3)
            {
                int secondActiveProjectIndex =
                    7 + ((employeeIndex + 5) % 13);

                AddProjectAssignment(
                    projectAssignments,
                    assignmentKeys,
                    employees[employeeIndex],
                    projects[secondActiveProjectIndex]);
            }
        }

        await dbContext.EmployeeProjects.AddRangeAsync(
            projectAssignments);

        await SeedLeavePoliciesAsync(
            dbContext);

        await SeedLeaveRequestsAsync(
            dbContext,
            employees);

        await dbContext.SaveChangesAsync();
    }

    private static void AddProjectAssignment(
        ICollection<EmployeeProject> assignments,
        ISet<string> assignmentKeys,
        Employee employee,
        Project project)
    {
        string key =
            $"{employee.Id:N}:{project.Id:N}";

        if (!assignmentKeys.Add(key))
        {
            return;
        }

        assignments.Add(
            new EmployeeProject(
                employee.Id,
                project.Id));
    }

    private static async Task SeedLeavePoliciesAsync(
        ApplicationDbContext dbContext)
    {
        if (await dbContext.LeavePolicies.AnyAsync())
        {
            return;
        }

        LeavePolicy[] policies =
        [
            new LeavePolicy(
                Guid.NewGuid(),
                LeaveType.Casual,
                10,
                false),

            new LeavePolicy(
                Guid.NewGuid(),
                LeaveType.Annual,
                20,
                false),

            new LeavePolicy(
                Guid.NewGuid(),
                LeaveType.Sick,
                12,
                false),

            new LeavePolicy(
                Guid.NewGuid(),
                LeaveType.Unpaid,
                null,
                true)
        ];

        await dbContext.LeavePolicies.AddRangeAsync(
            policies);
    }

    private static async Task SeedLeaveRequestsAsync(
        ApplicationDbContext dbContext,
        IReadOnlyList<Employee> employees)
    {
        if (await dbContext.LeaveRequests.AnyAsync())
        {
            return;
        }

        DateOnly today =
            DateOnly.FromDateTime(
                DateTime.UtcNow);

        string[] reasons =
        [
            "Family commitment",
            "Medical appointment",
            "Personal work",
            "Out-of-city travel",
            "Family event",
            "Rest and recovery",
            "Urgent personal matter",
            "Home maintenance appointment"
        ];

        List<LeaveRequest> requests =
            new();

        for (int index = 0;
             index < employees.Count;
             index++)
        {
            Employee employee =
                employees[index];

            /*
             * Every employee gets at least one leave record.
             * Employees at regular intervals get a second record,
             * giving the dashboard meaningful history and balances.
             */
            LeaveType primaryType =
                (index % 3) switch
                {
                    0 => LeaveType.Annual,
                    1 => LeaveType.Casual,
                    _ => LeaveType.Sick
                };

            int primaryDays =
                1 + (index % 3);

            DateOnly primaryStart =
                today.AddDays(
                    -60 + (index % 45));

            requests.Add(
                new LeaveRequest(
                    employee.Id,
                    primaryType,
                    primaryStart,
                    primaryStart.AddDays(
                        primaryDays - 1),
                    primaryDays,
                    reasons[index % reasons.Length]));

            if (index % 3 == 0)
            {
                LeaveType secondType =
                    primaryType == LeaveType.Annual
                        ? LeaveType.Casual
                        : LeaveType.Annual;

                int secondDays =
                    1 + (index % 2);

                DateOnly secondStart =
                    today.AddDays(
                        5 + (index % 25));

                requests.Add(
                    new LeaveRequest(
                        employee.Id,
                        secondType,
                        secondStart,
                        secondStart.AddDays(
                            secondDays - 1),
                        secondDays,
                        reasons[
                            (index + 3) %
                            reasons.Length]));
            }
        }

        await dbContext.LeaveRequests.AddRangeAsync(
            requests);
    }

    private static async Task SeedTeamLeadRolesAsync(
        UserManager<ApplicationUser> userManager)
    {
        foreach (string email in TeamLeadEmails)
        {
            ApplicationUser? teamLead =
                await userManager.FindByEmailAsync(
                    email);

            if (teamLead is null)
            {
                throw new InvalidOperationException(
                    $"Team Lead user '{email}' was not found.");
            }

            await AddRoleIfMissingAsync(
                userManager,
                teamLead,
                AppRoles.Employee);

            await AddRoleIfMissingAsync(
                userManager,
                teamLead,
                AppRoles.TeamLead);
        }
    }

    private static async Task SeedLeaveReviewStatusesAsync(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        List<LeaveRequest> pendingRequests =
            await dbContext.LeaveRequests
                .Where(
                    request =>
                        request.Status ==
                        LeaveStatus.Pending)
                .OrderBy(
                    request =>
                        request.AppliedAtUtc)
                .ToListAsync();

        if (pendingRequests.Count == 0)
        {
            return;
        }

        ApplicationUser? reviewer =
            await userManager.FindByEmailAsync(
                TeamLeadEmails[0]);

        reviewer ??=
            await userManager.FindByEmailAsync(
                SuperAdminEmail);

        if (reviewer is null)
        {
            return;
        }

        /*
         * Roughly one third remain pending, one third are approved,
         * and one third are rejected. This gives every dashboard
         * useful status data without manual setup.
         */
        for (int index = 0;
             index < pendingRequests.Count;
             index++)
        {
            LeaveRequest request =
                pendingRequests[index];

            switch (index % 3)
            {
                case 0:
                    break;

                case 1:
                    request.Approve(
                        reviewer.Id,
                        "Approved after reviewing the leave request.");
                    break;

                case 2:
                    request.Reject(
                        reviewer.Id,
                        "Unable to approve the requested dates.");
                    break;
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static string BuildCnic(
        int employeeNumber)
    {
        int middle =
            1000000 + employeeNumber;

        int checkDigit =
            (employeeNumber % 9) + 1;

        return
            $"35202-{middle:D7}-{checkDigit}";
    }

    private static string BuildPhoneNumber(
        int employeeNumber)
    {
        int prefix =
            300 + (employeeNumber % 10);

        int subscriber =
            1000000 + employeeNumber;

        return
            $"{prefix:D3}-{subscriber:D7}";
    }

    private static DateTime BuildDateOfBirth(
        int employeeNumber)
    {
        int year =
            1986 + (employeeNumber % 16);

        int month =
            1 + (employeeNumber % 12);

        int day =
            1 + (employeeNumber % 27);

        return new DateTime(
            year,
            month,
            day);
    }

    private static string GetStreetName(
        int index)
    {
        string[] streets =
        [
            "Jinnah Avenue",
            "Iqbal Road",
            "Garden Street",
            "University Road",
            "Canal View",
            "Model Town Road",
            "Gulshan Avenue",
            "Park Road"
        ];

        return streets[index % streets.Length];
    }

    private static string GetPostalCode(
        string city)
    {
        return city switch
        {
            "Karachi" => "75500",
            "Lahore" => "54000",
            "Islamabad" => "44000",
            "Rawalpindi" => "46000",
            "Faisalabad" => "38000",
            "Multan" => "60000",
            "Hyderabad" => "71000",
            "Peshawar" => "25000",
            _ => "44000"
        };
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