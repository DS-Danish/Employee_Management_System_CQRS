export type UserRole =
  | "SuperAdmin"
  | "TeamLead"
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
  expiresAtUtc: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  employeeId: string | null;
}

export interface StoredUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  employeeId: string | null;
  expiresAtUtc: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}