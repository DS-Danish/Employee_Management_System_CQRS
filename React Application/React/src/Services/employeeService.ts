import { apiRequest, ApiError } from "./apiClient";

import type {
  CreateEmployeeDetailRequest,
  CreateEmployeeRequest,
  Employee,
  EmployeeByIdResponse,
  EmployeeDetail,
  EmployeeListResponse,
  UpdateEmployeeRequest,
} from "../Types/employee";

export async function getEmployees(): Promise<Employee[]> {
  const response =
    await apiRequest<EmployeeListResponse>(
      "/employees?pageNumber=1&pageSize=100",
    );

  return response.items;
}

export function getEmployeeById(
  employeeId: string,
): Promise<EmployeeByIdResponse> {
  return apiRequest<EmployeeByIdResponse>(
    `/employees/${employeeId}`,
  );
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

  const employeeId: string =
    typeof response === "string"
      ? response
      : response.id;

  if (!employeeId) {
    throw new Error(
      "The employee API did not return an employee ID.",
    );
  }

  return employeeId;
}

export function updateEmployee(
  employeeId: string,
  request: UpdateEmployeeRequest,
): Promise<void> {
  return apiRequest<void>(
    `/employees/${employeeId}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
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

export interface MyEmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;

  departmentId?: string | null;
  departmentName?: string | null;

  street?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

export interface UpdateMyEmployeeProfileRequest {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export async function getMyEmployeeProfile():
  Promise<MyEmployeeProfile> {
  return apiRequest<MyEmployeeProfile>(
    "/employees/me",
  );
}

export async function updateMyEmployeeProfile(
  request: UpdateMyEmployeeProfileRequest,
): Promise<void> {
  await apiRequest<void>(
    "/employees/me",
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );
}