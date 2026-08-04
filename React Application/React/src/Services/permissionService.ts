import {
  apiRequest,
} from "./apiClient";

import type {
  Permission,
  PermissionUser,
  UpdateUserPermissionsRequest,
} from "../Types/permission";

export async function getPermissions():
  Promise<Permission[]> {
  return apiRequest<Permission[]>(
    "/permissions",
  );
}

export async function getPermissionUsers():
  Promise<PermissionUser[]> {
  return apiRequest<PermissionUser[]>(
    "/permissions/users",
  );
}

export async function getUserPermissions(
  userId: string,
): Promise<Permission[]> {
  return apiRequest<Permission[]>(
    `/permissions/users/${userId}`,
  );
}

export async function updateUserPermissions(
  userId: string,
  permissionIds: number[],
): Promise<void> {
  const request:
    UpdateUserPermissionsRequest = {
      permissionIds,
    };

  await apiRequest<void>(
    `/permissions/users/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}