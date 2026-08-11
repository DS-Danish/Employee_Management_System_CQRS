export interface Permission {
  id: number;
  name: string;
  code: string;
}

export interface PermissionRole {
  name: string;
  displayName: string;
}

export interface UpdateRolePermissionsRequest {
  permissionIds: number[];
}