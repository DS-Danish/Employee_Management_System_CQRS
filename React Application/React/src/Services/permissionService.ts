import {
  apiRequest,
} from "./apiClient";

import type {
  Permission,
  PermissionRole,
  UpdateRolePermissionsRequest,
} from "../Types/permission";

export async function getPermissions():
  Promise<Permission[]> {
  return apiRequest<Permission[]>(
    "/permissions",
  );
}

export async function getPermissionRoles():
  Promise<PermissionRole[]> {
  return apiRequest<PermissionRole[]>(
    "/permissions/roles",
  );
}

export async function getRolePermissions(
  roleName: string,
): Promise<Permission[]> {
  return apiRequest<Permission[]>(
    `/permissions/roles/${encodeURIComponent(roleName)}`,
  );
}

export async function updateRolePermissions(
  roleName: string,
  permissionIds: number[],
): Promise<void> {
  const request: UpdateRolePermissionsRequest = {
    permissionIds,
  };

  await apiRequest<void>(
    `/permissions/roles/${encodeURIComponent(roleName)}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}