using EmployeeManagement.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Infrastructure.Persistence.Configurations;

public sealed class UserPermissionConfiguration
    : IEntityTypeConfiguration<UserPermission>
{
    public void Configure(
        EntityTypeBuilder<UserPermission> builder)
    {
        builder.ToTable(
            "UserPermissions");

        builder.HasKey(
            userPermission =>
                new
                {
                    userPermission.UserId,
                    userPermission.PermissionId,
                });

        builder.Property(
                userPermission =>
                    userPermission.UserId)
            .IsRequired();

        builder.HasOne(
                userPermission =>
                    userPermission.User)
            .WithMany()
            .HasForeignKey(
                userPermission =>
                    userPermission.UserId)
            .OnDelete(
                DeleteBehavior.Cascade);

        builder.HasOne(
                userPermission =>
                    userPermission.Permission)
            .WithMany(
                permission =>
                    permission.UserPermissions)
            .HasForeignKey(
                userPermission =>
                    userPermission.PermissionId)
            .OnDelete(
                DeleteBehavior.Cascade);
    }
}