import { apiRequest } from "./apiClient";

import type { EmployeeProject } from "../Types/project";

export function getEmployeeProjects(
  employeeId: string,
): Promise<EmployeeProject[]> {
  return apiRequest<EmployeeProject[]>(
    `/employees/${employeeId}/projects`,
  );
}

export function assignEmployeeToProject(
  employeeId: string,
  projectId: string,
): Promise<void> {
  return apiRequest<void>(
    `/employees/${employeeId}/projects/${projectId}`,
    {
      method: "POST",
    },
  );
}

export function removeEmployeeFromProject(
  employeeId: string,
  projectId: string,
): Promise<void> {
  return apiRequest<void>(
    `/employees/${employeeId}/projects/${projectId}`,
    {
      method: "DELETE",
    },
  );
}