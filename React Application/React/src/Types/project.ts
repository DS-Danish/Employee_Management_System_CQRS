export type ProjectStatus =
  | "Active"
  | "Completed";

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string | null;
  createdAtUtc?: string;
  status: ProjectStatus;
}

export interface EmployeeProject {
  employeeId: string;
  projectId: string;
  projectName?: string;
}

export interface ProjectEmployee {
  employeeId: string;
  fullName: string;
  email: string;
}