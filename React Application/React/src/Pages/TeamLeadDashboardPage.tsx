import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
} from "@mui/material";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { AppPermissions } from "../Constants/permissions";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BadgeIcon from "@mui/icons-material/Badge";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import ApartmentIcon from "@mui/icons-material/Apartment";
import WorkIcon from "@mui/icons-material/Work";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getMyLeaves, getPendingLeaves } from "../services/leaveService";
import type { StoredUser } from "../Types/auth";
import type { Leave } from "../Types/leave";

const ACCENT_INDIGO = "#4F46E5";
const ACCENT_VIOLET = "#7C3AED";
const ACCENT_AMBER = "#D97706";
const ACCENT_BLUE = "#2563EB";
const ACCENT_GREEN = "#16A34A";
const ACCENT_RED = "#DC2626";
const ACCENT_SLATE = "#64748B";

interface ActionCardProps {
  icon: ReactNode;
  color: string;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}

interface ChartItem {
  label: string;
  value: number;
  color: string;
}

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export default function TeamLeadDashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const currentUser: StoredUser | null = getStoredUser();

  const userPermissions: string[] =
    currentUser?.permissions ?? [];

  const canViewEmployees: boolean =
    userPermissions.includes(AppPermissions.ViewEmployees);

  const canViewDepartments: boolean =
    userPermissions.includes(AppPermissions.ViewDepartments);

  const canViewProjects: boolean =
    userPermissions.includes(AppPermissions.ViewProjects);

  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  async function loadDashboard(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [myLeavesResult, pendingLeavesResult] = await Promise.all([
        getMyLeaves(),
        getPendingLeaves(),
      ]);

      setMyLeaves(myLeavesResult);
      setPendingLeaves(pendingLeavesResult);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load dashboard information.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const myLeaveCounts: StatusCounts = useMemo(() => {
    return myLeaves.reduce<StatusCounts>(
      (counts: StatusCounts, leave: Leave): StatusCounts => {
        const status: string = normalizeLeaveStatus(leave.status);

        if (status === "pending") {
          counts.pending += 1;
        } else if (status === "approved") {
          counts.approved += 1;
        } else if (status === "rejected") {
          counts.rejected += 1;
        }

        return counts;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    );
  }, [myLeaves]);

  const myLeaveChart: ChartItem[] = useMemo(
    () => [
      {
        label: "Pending",
        value: myLeaveCounts.pending,
        color: ACCENT_AMBER,
      },
      {
        label: "Approved",
        value: myLeaveCounts.approved,
        color: ACCENT_GREEN,
      },
      {
        label: "Rejected",
        value: myLeaveCounts.rejected,
        color: ACCENT_RED,
      },
    ],
    [myLeaveCounts],
  );

  const pendingLeaveTypeChart: ChartItem[] = useMemo(() => {
    const counts = new Map<string, number>();

    pendingLeaves.forEach((leave: Leave) => {
      const label: string = getLeaveTypeText(leave.leaveType);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    const colors: string[] = [
      ACCENT_INDIGO,
      ACCENT_AMBER,
      ACCENT_VIOLET,
      ACCENT_BLUE,
      ACCENT_GREEN,
      ACCENT_SLATE,
    ];

    return Array.from(counts.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .map(
        ([label, value]: [string, number], index: number): ChartItem => ({
          label,
          value,
          color: colors[index % colors.length],
        }),
      );
  }, [pendingLeaves]);

  return (
    <Box sx={{ bgcolor: "#F5F7FB", minHeight: "100%" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 3,
              background:
                "linear-gradient(120deg, #0B1120 0%, #1E1B4B 55%, #4F46E5 100%)",
              color: "common.white",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
                opacity: 0.5,
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", p: { xs: 3, md: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", md: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 3,
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 58,
                      height: 58,
                      display: { xs: "none", sm: "flex" },
                      fontWeight: 800,
                      fontSize: 18,
                      bgcolor: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {getInitials(currentUser?.fullName)}
                  </Avatar>

                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ opacity: 0.75, letterSpacing: 2 }}
                    >
                      Employee Management System
                    </Typography>

                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                      Team Lead Dashboard
                    </Typography>

                    <Typography sx={{ mt: 1, opacity: 0.85, maxWidth: 650 }}>
                      Welcome back, {currentUser?.fullName ?? "Team Lead"}.
                      Manage your team and monitor leave activity from one place.
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  type="button"
                  variant="outlined"
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                  disabled={loading}
                  onClick={() => void loadDashboard()}
                  sx={{
                    color: "common.white",
                    borderColor: "rgba(255,255,255,0.45)",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    "&:hover": {
                      borderColor: "common.white",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Management
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Access only the modules currently available to your Team Lead account.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {canViewEmployees && (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <ActionCard
                  icon={<GroupsIcon />}
                  color={ACCENT_INDIGO}
                  title="Employees"
                  description="View and manage employee records available to your account."
                  buttonLabel="Manage employees"
                  onClick={() => navigate("/team-lead/employees")}
                />
              </Grid>
            )}

            {canViewDepartments && (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <ActionCard
                  icon={<ApartmentIcon />}
                  color="#0D9488"
                  title="Departments"
                  description="View department information available to your account."
                  buttonLabel="Manage departments"
                  onClick={() => navigate("/team-lead/departments")}
                />
              </Grid>
            )}

            {canViewProjects && (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <ActionCard
                  icon={<WorkIcon />}
                  color={ACCENT_VIOLET}
                  title="Projects"
                  description="View and manage projects available to your account."
                  buttonLabel="Manage projects"
                  onClick={() => navigate("/team-lead/projects")}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <ActionCard
                icon={<EventAvailableIcon />}
                color={ACCENT_BLUE}
                title="My Leaves"
                description="Apply for leave, review your balance and track your requests."
                buttonLabel="Manage my leaves"
                onClick={() => navigate("/team-lead/leaves")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <ActionCard
                icon={<PendingActionsIcon />}
                color={ACCENT_AMBER}
                title="Pending Requests"
                description={
                  loading
                    ? "Loading pending employee leave requests..."
                    : `${pendingLeaves.length} leave request${
                        pendingLeaves.length === 1 ? "" : "s"
                      } currently require your review.`
                }
                buttonLabel="Review requests"
                badge={loading ? undefined : pendingLeaves.length}
                onClick={() => navigate("/team-lead/leave-requests")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <ActionCard
                icon={<PersonIcon />}
                color={ACCENT_SLATE}
                title="My Profile"
                description="Review your account details and personal profile information."
                buttonLabel="View profile"
                onClick={() => navigate("/team-lead/profile")}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Insights
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Live leave information based on your current account and pending team requests.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ChartCard
                title="My Leave Status"
                description="Status of leave requests submitted from your account."
                icon={<EventAvailableIcon />}
                accent={ACCENT_BLUE}
                data={myLeaveChart}
                loading={loading}
                emptyMessage="You have not submitted any leave requests yet."
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <ChartCard
                title="Pending Team Leaves"
                description="Pending employee requests grouped by leave type."
                icon={<PendingActionsIcon />}
                accent={ACCENT_AMBER}
                data={pendingLeaveTypeChart}
                loading={loading}
                emptyMessage="There are no pending team leave requests."
              />
            </Grid>
          </Grid>

          <Card
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${ACCENT_BLUE} 0%, ${ACCENT_VIOLET} 100%)`,
                    }}
                  >
                    {getInitials(currentUser?.fullName)}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>
                      {currentUser?.fullName ?? "Team Lead"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentUser?.email ?? "Email not available"}
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  icon={<BadgeIcon sx={{ fontSize: 16 }} />}
                  label={currentUser?.role ?? "TeamLead"}
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(ACCENT_BLUE, 0.1),
                    color: ACCENT_BLUE,
                    "& .MuiChip-icon": { color: ACCENT_BLUE },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

interface ExtendedActionCardProps extends ActionCardProps {
  badge?: number;
}

function ActionCard({
  icon,
  color,
  title,
  description,
  buttonLabel,
  badge,
  onClick,
}: ExtendedActionCardProps): React.ReactElement {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        boxShadow: "none",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{ height: 4, bgcolor: color }} />

      <CardContent
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Avatar sx={{ bgcolor: alpha(color, 0.12), color }}>
            {icon}
          </Avatar>

          {badge !== undefined && (
            <Chip
              label={badge}
              size="small"
              sx={{
                minWidth: 34,
                fontWeight: 800,
                bgcolor: alpha(color, 0.1),
                color,
              }}
            />
          )}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 3, flexGrow: 1, lineHeight: 1.65 }}
        >
          {description}
        </Typography>

        <Button
          type="button"
          variant="contained"
          disableElevation
          endIcon={<ArrowForwardIcon />}
          onClick={onClick}
          sx={{
            alignSelf: "flex-start",
            borderRadius: 2,
            bgcolor: color,
            textTransform: "none",
            fontWeight: 700,
            "&:hover": {
              bgcolor: color,
              filter: "brightness(0.92)",
            },
          }}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent: string;
  data: ChartItem[];
  loading: boolean;
  emptyMessage: string;
}

function ChartCard({
  title,
  description,
  icon,
  accent,
  data,
  loading,
  emptyMessage,
}: ChartCardProps): React.ReactElement {
  const total: number = data.reduce(
    (sum: number, item: ChartItem): number => sum + item.value,
    0,
  );

  const maxValue: number = Math.max(
    1,
    ...data.map((item: ChartItem): number => item.value),
  );

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.75 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(accent, 0.1),
              color: accent,
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : total === 0 ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Typography color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                height: 190,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-around",
                gap: 2,
                px: { xs: 0, sm: 2 },
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {data.map((item: ChartItem) => {
                const height: number = Math.max(
                  18,
                  (item.value / maxValue) * 150,
                );

                return (
                  <Box
                    key={item.label}
                    sx={{
                      flex: 1,
                      maxWidth: 100,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 800, mb: 0.75 }}
                    >
                      {item.value}
                    </Typography>

                    <Box
                      sx={{
                        width: "58%",
                        minWidth: 30,
                        height,
                        borderRadius: "8px 8px 0 0",
                        bgcolor: item.color,
                        transition: "height 250ms ease",
                      }}
                    />
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                gap: 2,
                mt: 1.25,
                px: { xs: 0, sm: 2 },
              }}
            >
              {data.map((item: ChartItem) => (
                <Typography
                  key={item.label}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    flex: 1,
                    maxWidth: 100,
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function getStoredUser(): StoredUser | null {
  const storedUserJson: string | null =
    localStorage.getItem("authUser");

  if (!storedUserJson) {
    return null;
  }

  try {
    const storedUser: StoredUser =
      JSON.parse(storedUserJson) as StoredUser;

    if (storedUser.role !== "TeamLead") {
      return null;
    }

    return storedUser;
  } catch {
    return null;
  }
}

function getInitials(fullName?: string): string {
  if (!fullName?.trim()) {
    return "TL";
  }

  const nameParts: string[] =
    fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return (
    nameParts[0][0] +
    nameParts[nameParts.length - 1][0]
  ).toUpperCase();
}

/*
 * Handles both string statuses and common numeric enum values.
 * If your LeaveStatus enum uses different numeric values, replace
 * these three numbers with the enum's actual values.
 */
function normalizeLeaveStatus(status: unknown): string {
  if (typeof status === "string") {
    const normalized: string = status.trim().toLowerCase();

    if (normalized === "pending" || normalized === "1") {
      return "pending";
    }

    if (normalized === "approved" || normalized === "2") {
      return "approved";
    }

    if (normalized === "rejected" || normalized === "3") {
      return "rejected";
    }

    return normalized;
  }

  if (status === 1) {
    return "pending";
  }

  if (status === 2) {
    return "approved";
  }

  if (status === 3) {
    return "rejected";
  }

  return "";
}

function getLeaveTypeText(leaveType: unknown): string {
  if (typeof leaveType === "string") {
    const trimmed: string = leaveType.trim();

    if (trimmed && !/^\d+$/.test(trimmed)) {
      return trimmed;
    }
  }

  const numericType: number = Number(leaveType);

  switch (numericType) {
    case 1:
      return "Annual";
    case 2:
      return "Sick";
    case 3:
      return "Casual";
    default:
      return `Type ${String(leaveType)}`;
  }
}