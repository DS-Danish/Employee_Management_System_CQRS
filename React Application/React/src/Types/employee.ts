import type { Department } from "./department";
import type { Project } from "./project";

export interface EmployeeDetail {
  id?: string;
  employeeId?: string;
  cnic: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  city: string;

  departmentId?: string | null;
  departmentName?: string | null;
  department?: Department | null;

  employeeDetail?: EmployeeDetail | null;
  projects?: Project[];
}

export interface EmployeeListResponse {
  items: Employee[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface CreateEmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;

  street: string;
  city: string;
  country: string;
  postalCode: string;

  departmentId: string;
  projectIds: string[];

  cnic: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;

  street: string;
  city: string;
  country: string;
  postalCode: string;

  departmentId: string | null;
}

export interface CreateEmployeeDetailRequest {
  cnic: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
}