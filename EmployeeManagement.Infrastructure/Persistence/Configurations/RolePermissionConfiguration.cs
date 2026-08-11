using EmployeeManagement.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class RolePermissionConfiguration
    : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(
        EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions");

        builder.HasKey(
            rolePermission => new
            {
                rolePermission.RoleId,
                rolePermission.PermissionId
            });

        builder.Property(
                rolePermission => rolePermission.RoleId)
            .HasMaxLength(450)
            .IsRequired();

        builder.HasOne(
                rolePermission => rolePermission.Role)
            .WithMany()
            .HasForeignKey(
                rolePermission => rolePermission.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(
                rolePermission => rolePermission.Permission)
            .WithMany(
                permission => permission.RolePermissions)
            .HasForeignKey(
                rolePermission => rolePermission.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}