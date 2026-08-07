using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class LeaveRequestConfiguration
    : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(
        EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.ToTable(
            "LeaveRequests");

        builder.HasKey(
            leaveRequest =>
                leaveRequest.Id);

        builder.Property(
                leaveRequest =>
                    leaveRequest.Id)
            .ValueGeneratedNever();

        builder.Property(
                leaveRequest =>
                    leaveRequest.EmployeeId)
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.LeaveType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.StartDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.EndDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.NumberOfDays)
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.Reason)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.AppliedAtUtc)
            .IsRequired();

        builder.Property(
                leaveRequest =>
                    leaveRequest.ReviewedByUserId)
            .HasMaxLength(450)
            .IsRequired(false);

        builder.Property(
                leaveRequest =>
                    leaveRequest.ReviewedAtUtc)
            .IsRequired(false);

        builder.Property(
                leaveRequest =>
                    leaveRequest.ReviewComment)
            .HasMaxLength(500)
            .IsRequired(false);

        /*
         * LeaveRequest.EmployeeId
         *             ↓
         * Employee.Id
         */
        builder.HasOne(
                leaveRequest =>
                    leaveRequest.Employee)
            .WithMany()
            .HasForeignKey(
                leaveRequest =>
                    leaveRequest.EmployeeId)
            .OnDelete(
                DeleteBehavior.Restrict);

        /*
         * Useful when loading all leave requests
         * for one employee.
         */
        builder.HasIndex(
            leaveRequest =>
                leaveRequest.EmployeeId);

        /*
         * Useful for:
         *
         * GET /api/leaves/pending
         */
        builder.HasIndex(
            leaveRequest =>
                leaveRequest.Status);

        /*
         * Useful when calculating yearly leave
         * usage/balance.
         */
        builder.HasIndex(
            leaveRequest =>
                new
                {
                    leaveRequest.EmployeeId,
                    leaveRequest.LeaveType,
                    leaveRequest.StartDate
                });

        /*
         * Prevent invalid NumberOfDays values
         * at database level.
         */
        builder.ToTable(
            "LeaveRequests",
            tableBuilder =>
            {
                tableBuilder.HasCheckConstraint(
                    "CK_LeaveRequests_NumberOfDays",
                    "[NumberOfDays] > 0");

                tableBuilder.HasCheckConstraint(
                    "CK_LeaveRequests_DateRange",
                    "[EndDate] >= [StartDate]");
            });
    }
}