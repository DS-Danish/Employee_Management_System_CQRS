import type { Department } from "../Types/department";
import { apiRequest } from "./apiClient";

export async function getDepartments(): Promise<Department[]> {
  return apiRequest<Department[]>("/departments");
}