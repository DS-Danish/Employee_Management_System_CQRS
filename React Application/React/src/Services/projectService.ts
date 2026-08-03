import type {
  Project,
} from "../Types/project";

import {
  apiRequest,
} from "./apiClient";

export async function getProjects():
  Promise<Project[]> {
  return apiRequest<Project[]>(
    "/projects",
  );
}

export async function completeProject(
  projectId: string,
): Promise<void> {
  await apiRequest<void>(
    `/projects/${projectId}/complete`,
    {
      method: "PUT",
    },
  );
}