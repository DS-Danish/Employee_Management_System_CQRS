export type UserRole =
  | "SuperAdmin"
  | "TeamLead"
  | "Employee";

export interface AvailableEmployee {
  id: string;
  fullName: string;
  email: string;
  departmentId: string | null;
}

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
  expiresAtUtc: string;

  userId: string;
  fullName: string;
  email: string;
  role: UserRole;

  departmentId: string | null;
  employeeId: string | null;

  permissions: string[];
}

export interface StoredUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;

  departmentId: string | null;
  employeeId: string | null;

  expiresAtUtc: string;

  permissions: string[];
}

export interface ApiErrorResponse {
  message?: string;

  title?: string;

  errors?:
    | string[]
    | Record<string, string[]>;
}