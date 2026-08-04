export interface Permission {
  id: number;
  name: string;
  code: string;
}

export interface PermissionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UpdateUserPermissionsRequest {
  permissionIds: number[];
}