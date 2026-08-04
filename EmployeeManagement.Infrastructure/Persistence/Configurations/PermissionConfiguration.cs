using EmployeeManagement.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class PermissionConfiguration
    : IEntityTypeConfiguration<Permission>
{
    public void Configure(
        EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable(
            "Permissions");

        builder.HasKey(
            permission =>
                permission.Id);

        builder.Property(
                permission =>
                    permission.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(
                permission =>
                    permission.Code)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(
                permission =>
                    permission.Code)
            .IsUnique();
    }
}