using EmployeeManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class EmployeeDetailConfiguration
    : IEntityTypeConfiguration<EmployeeDetail>
{
    public void Configure(
        EntityTypeBuilder<EmployeeDetail> builder)
    {
        builder.ToTable("EmployeeDetails");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Cnic)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.PhoneNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Gender)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(x => x.Cnic)
            .IsUnique();

        builder.HasIndex(x => x.EmployeeId)
            .IsUnique();

        builder.HasOne(x => x.Employee)
            .WithOne()
            .HasForeignKey<EmployeeDetail>(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}