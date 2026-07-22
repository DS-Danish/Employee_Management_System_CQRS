import { apiRequest, ApiError } from "./apiClient";

import type {
  CreateEmployeeDetailRequest,
  CreateEmployeeRequest,
  Employee,
  EmployeeDetail,
  EmployeeListResponse,
} from "../Types/employee";

export async function getEmployees(): Promise<Employee[]> {
  const response =
    await apiRequest<EmployeeListResponse>(
      "/employees?pageNumber=1&pageSize=100",
    );

  return response.items;
}

export async function createEmployee(
  request: CreateEmployeeRequest,
): Promise<string> {
  const response = await apiRequest<
    string | { id: string }
  >("/employees", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (typeof response === "string") {
    return response;
  }

  return response.id;
}

export async function getEmployeeDetail(
  employeeId: string,
): Promise<EmployeeDetail | null> {
  try {
    return await apiRequest<EmployeeDetail>(
      `/employees/${employeeId}/details`,
    );
  } catch (error: unknown) {
    if (
      error instanceof ApiError &&
      error.status === 404
    ) {
      return null;
    }

    throw error;
  }
}

export function createEmployeeDetail(
  employeeId: string,
  request: CreateEmployeeDetailRequest,
): Promise<EmployeeDetail> {
  return apiRequest<EmployeeDetail>(
    `/employees/${employeeId}/details`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function deleteEmployee(
  employeeId: string,
): Promise<void> {
  return apiRequest<void>(
    `/employees/${employeeId}`,
    {
      method: "DELETE",
    },
  );
}