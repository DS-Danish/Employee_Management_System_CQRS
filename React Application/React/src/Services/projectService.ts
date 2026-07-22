import type { Project } from "../Types/project";
import { apiRequest } from "./apiClient";

export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>("/projects");
}