import {
  apiRequest,
} from "./apiClient";

import type {
  ApplyLeaveRequest,
  Leave,
  LeaveBalance,
  LeavePolicy,
  ReviewLeaveRequest,
  UpdateLeavePolicyRequest,
} from "../Types/leave";

export async function applyLeave(
  request: ApplyLeaveRequest,
): Promise<string> {
  return apiRequest<string>(
    "/leaves",
    {
      method: "POST",

      body: JSON.stringify(
        request,
      ),
    },
  );
}

export async function getMyLeaves():
Promise<Leave[]> {
  return apiRequest<Leave[]>(
    "/leaves/my",
  );
}

export async function getMyLeaveBalance(
  year?: number,
): Promise<LeaveBalance[]> {
  const query: string =
    year
      ? `?year=${year}`
      : "";

  return apiRequest<LeaveBalance[]>(
    `/leaves/my/balance${query}`,
  );
}

export async function getPendingLeaves():
Promise<Leave[]> {
  return apiRequest<Leave[]>(
    "/leaves/pending",
  );
}

export async function approveLeave(
  leaveRequestId: string,
  comment?: string,
): Promise<void> {
  const request: ReviewLeaveRequest = {
    comment:
      comment?.trim() ||
      null,
  };

  await apiRequest<void>(
    `/leaves/${leaveRequestId}/approve`,
    {
      method: "PUT",

      body: JSON.stringify(
        request,
      ),
    },
  );
}

export async function rejectLeave(
  leaveRequestId: string,
  comment: string,
): Promise<void> {
  const request: ReviewLeaveRequest = {
    comment:
      comment.trim(),
  };

  await apiRequest<void>(
    `/leaves/${leaveRequestId}/reject`,
    {
      method: "PUT",

      body: JSON.stringify(
        request,
      ),
    },
  );
}

export async function getAllLeaves():
Promise<Leave[]> {
  return apiRequest<Leave[]>(
    "/leaves/all",
  );
}

export async function getLeavePolicies():
Promise<LeavePolicy[]> {
  return apiRequest<LeavePolicy[]>(
    "/leave-policies",
  );
}

export async function updateLeavePolicy(
  leaveType: number,
  allowedDaysPerYear: number,
): Promise<void> {
  const request: UpdateLeavePolicyRequest = {
    allowedDaysPerYear,
  };

  await apiRequest<void>(
    `/leave-policies/${leaveType}`,
    {
      method: "PUT",

      body: JSON.stringify(
        request,
      ),
    },
  );
}