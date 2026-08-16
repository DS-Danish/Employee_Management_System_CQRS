import type {
  Project,
} from "../Types/project";

import {
  apiRequest,
} from "./apiClient";

export interface GetProjectsPageOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?:
    | "all"
    | "ongoing"
    | "completed";
}

export interface GetProjectsPageResponse {
  items: Project[];
  hasMore: boolean;
  totalCount: number;
  ongoingCount: number;
  completedCount: number;
  filteredCount: number;
  filteredOngoingCount: number;
  filteredCompletedCount: number;
}

export async function getProjects():
  Promise<Project[]> {
  return apiRequest<Project[]>(
    "/projects",
  );
}

export async function getProjectsPage(
  options:
    GetProjectsPageOptions = {},
): Promise<GetProjectsPageResponse> {
  const parameters =
    new URLSearchParams();

  parameters.set(
    "page",
    String(options.page ?? 1),
  );

  parameters.set(
    "pageSize",
    String(options.pageSize ?? 10),
  );

  if (options.search?.trim()) {
    parameters.set(
      "search",
      options.search.trim(),
    );
  }

  if (
    options.status &&
    options.status !== "all"
  ) {
    parameters.set(
      "status",
      options.status,
    );
  }

  return apiRequest<GetProjectsPageResponse>(
    `/projects/paged?${parameters.toString()}`,
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