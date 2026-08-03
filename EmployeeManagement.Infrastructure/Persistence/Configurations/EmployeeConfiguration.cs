using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class EmployeeConfiguration
    : IEntityTypeConfiguration<Employee>
{
    public void Configure(
        EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        builder.HasKey(employee => employee.Id);

        builder.Property(employee => employee.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(employee => employee.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(employee => employee.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(employee => employee.CreatedAtUtc)
            .IsRequired();

        builder.Property(employee => employee.DepartmentId)
            .IsRequired(false);

        builder.Property(employee => employee.TeamLeadId)
            .IsRequired(false);

        builder.HasIndex(employee => employee.Email)
            .IsUnique();

        builder.HasIndex(employee => new
        {
            employee.FirstName,
            employee.LastName
        });

        builder.HasIndex(employee => employee.DepartmentId);

        builder.HasIndex(employee => employee.TeamLeadId);

        builder.OwnsOne(
            employee => employee.Address,
            address =>
            {
                address.Property(value => value.Street)
                    .HasColumnName("Street")
                    .HasMaxLength(200)
                    .IsRequired();

                address.Property(value => value.City)
                    .HasColumnName("City")
                    .HasMaxLength(100)
                    .IsRequired();

                address.Property(value => value.Country)
                    .HasColumnName("Country")
                    .HasMaxLength(100)
                    .IsRequired();

                address.Property(value => value.PostalCode)
                    .HasColumnName("PostalCode")
                    .HasMaxLength(20)
                    .IsRequired();

                address.HasIndex(value => value.City);
            });

        builder.Navigation(employee => employee.Address)
            .IsRequired();

        builder.HasOne(employee => employee.Department)
            .WithMany()
            .HasForeignKey(employee => employee.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(employee => employee.TeamLead)
            .WithMany(employee => employee.TeamMembers)
            .HasForeignKey(employee => employee.TeamLeadId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}