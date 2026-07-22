export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string | null;
}

export interface EmployeeProject {
  employeeId: string;
  projectId: string;
  projectName?: string;
}