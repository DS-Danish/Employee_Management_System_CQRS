export type UserRole =
  | "SuperAdmin"
  | "DepartmentAdmin"
  | "Employee";

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId: string | null;
  employeeId: string | null;
}

export interface RegisterResponse {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  employeeId: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  employeeId: string | null;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}