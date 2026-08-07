using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class LeavePolicyConfiguration
    : IEntityTypeConfiguration<LeavePolicy>
{
    public void Configure(
        EntityTypeBuilder<LeavePolicy> builder)
    {
        builder.ToTable(
            "LeavePolicies");

        builder.HasKey(
            leavePolicy =>
                leavePolicy.Id);

        builder.Property(
                leavePolicy =>
                    leavePolicy.Id)
            .ValueGeneratedNever();

        builder.Property(
                leavePolicy =>
                    leavePolicy.LeaveType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(
                leavePolicy =>
                    leavePolicy.AllowedDaysPerYear)
            .IsRequired(false);

        builder.Property(
                leavePolicy =>
                    leavePolicy.IsUnlimited)
            .IsRequired();

        /*
         * There must only be one policy for
         * each leave type.
         *
         * Example:
         *
         * Casual -> one record
         * Annual -> one record
         * Sick   -> one record
         * Unpaid -> one record
         */
        builder.HasIndex(
                leavePolicy =>
                    leavePolicy.LeaveType)
            .IsUnique();

        /*
         * Default leave policies.
         *
         * These values can later be changed
         * by Super Admin.
         */
        builder.HasData(
            new
            {
                Id =
                    Guid.Parse(
                        "11111111-1111-1111-1111-111111111111"),

                LeaveType =
                    LeaveType.Casual,

                AllowedDaysPerYear =
                    (int?)10,

                IsUnlimited =
                    false
            },

            new
            {
                Id =
                    Guid.Parse(
                        "22222222-2222-2222-2222-222222222222"),

                LeaveType =
                    LeaveType.Annual,

                AllowedDaysPerYear =
                    (int?)20,

                IsUnlimited =
                    false
            },

            new
            {
                Id =
                    Guid.Parse(
                        "33333333-3333-3333-3333-333333333333"),

                LeaveType =
                    LeaveType.Sick,

                AllowedDaysPerYear =
                    (int?)10,

                IsUnlimited =
                    false
            },

            new
            {
                Id =
                    Guid.Parse(
                        "44444444-4444-4444-4444-444444444444"),

                LeaveType =
                    LeaveType.Unpaid,

                AllowedDaysPerYear =
                    (int?)null,

                IsUnlimited =
                    true
            });
    }
}