export const LeaveType = {
  Casual: 1,
  Annual: 2,
  Sick: 3,
  Unpaid: 4,
} as const;

export type LeaveType =
  (typeof LeaveType)[keyof typeof LeaveType];

export const LeaveStatus = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
} as const;

export type LeaveStatus =
  (typeof LeaveStatus)[keyof typeof LeaveStatus];

export interface Leave {
  id: string;

  employeeId: string;

  employeeName: string;

  leaveType: LeaveType;

  startDate: string;

  endDate: string;

  numberOfDays: number;

  reason: string;

  status: LeaveStatus;

  appliedAtUtc: string;

  reviewedByUserId: string | null;

  reviewedAtUtc: string | null;

  reviewComment: string | null;
}

export interface LeaveBalance {
  leaveType: LeaveType;

  allocatedDays: number | null;

  approvedDays: number;

  pendingDays: number;

  remainingDays: number | null;

  availableToApplyDays: number | null;

  isUnlimited: boolean;
}

export interface ApplyLeaveRequest {
  leaveType: LeaveType;

  startDate: string;

  endDate: string;

  reason: string;
}

export interface ReviewLeaveRequest {
  comment: string | null;
}

export interface LeavePolicy {
  id: string;

  leaveType: LeaveType;

  allowedDaysPerYear: number | null;

  isUnlimited: boolean;
}

export interface UpdateLeavePolicyRequest {
  allowedDaysPerYear: number;
}

export function getLeaveTypeLabel(
  leaveType: LeaveType,
): string {
  switch (leaveType) {
    case LeaveType.Casual:
      return "Casual";

    case LeaveType.Annual:
      return "Annual";

    case LeaveType.Sick:
      return "Sick";

    case LeaveType.Unpaid:
      return "Unpaid";

    default:
      return "Unknown";
  }
}

export function getLeaveStatusLabel(
  status: LeaveStatus,
): string {
  switch (status) {
    case LeaveStatus.Pending:
      return "Pending";

    case LeaveStatus.Approved:
      return "Approved";

    case LeaveStatus.Rejected:
      return "Rejected";

    default:
      return "Unknown";
  }
}