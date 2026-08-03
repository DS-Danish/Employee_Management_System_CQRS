import type {
  Department,
} from "../Types/department";

import {
  apiRequest,
} from "./apiClient";

export interface CreateDepartmentRequest {
  name: string;
}

export interface UpdateDepartmentRequest {
  name: string;
}

export function getDepartments():
  Promise<Department[]> {
  return apiRequest<Department[]>(
    "/departments",
  );
}

export function createDepartment(
  request: CreateDepartmentRequest,
): Promise<string> {
  return apiRequest<string>(
    "/departments",
    {
      method: "POST",
      body: JSON.stringify(
        request,
      ),
    },
  );
}

export function updateDepartment(
  departmentId: string,
  request: UpdateDepartmentRequest,
): Promise<void> {
  return apiRequest<void>(
    `/departments/${departmentId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        request,
      ),
    },
  );
}

export function deleteDepartment(
  departmentId: string,
): Promise<void> {
  return apiRequest<void>(
    `/departments/${departmentId}`,
    {
      method: "DELETE",
    },
  );
}