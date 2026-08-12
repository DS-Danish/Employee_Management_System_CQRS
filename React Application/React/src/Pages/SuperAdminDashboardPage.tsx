import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import ApartmentIcon from "@mui/icons-material/Apartment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import InsightsIcon from "@mui/icons-material/Insights";
import RefreshIcon from "@mui/icons-material/Refresh";
import WorkIcon from "@mui/icons-material/Work";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Pagination,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDepartments } from "../services/departmentService";
import { getEmployees } from "../services/employeeService";
import { getProjects } from "../services/projectService";
import {
  approveLeave,
  getPendingLeaves,
  rejectLeave,
} from "../services/leaveService";

import type { StoredUser } from "../Types/auth";

interface DashboardStatistics {
  employees: number;
  departments: number;
  projects: number;
  pendingLeaves: number;
}

interface CategoryConfig {
  key: keyof DashboardStatistics;
  label: string;
  color: string;
  icon: ReactNode;
}


// One accent color per record type. Reused across the stat cards,
// the header KPI strip, and both charts so everything reads as one system.
const CATEGORY_CONFIG: CategoryConfig[] = [
  { key: "employees", label: "Employees", color: "#4F46E5", icon: <GroupsIcon /> },
  { key: "departments", label: "Departments", color: "#0D9488", icon: <ApartmentIcon /> },
  { key: "projects", label: "Projects", color: "#7C3AED", icon: <WorkIcon /> },
  { key: "pendingLeaves", label: "Pending Leaves", color: "#D97706", icon: <EventAvailableIcon /> },
];


interface SummaryCardProps {
  title: string;
  value: number;
  loading: boolean;
  icon: ReactNode;
  color: string;
}


export default function SuperAdminDashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const currentUser: StoredUser | null = getStoredUser();

  const [statistics, setStatistics] = useState<DashboardStatistics>({
    employees: 0,
    departments: 0,
    projects: 0,
    pendingLeaves: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [pendingLeaveItems, setPendingLeaveItems] = useState<
    Record<string, unknown>[]
  >([]);
  const [pendingLeavePage, setPendingLeavePage] = useState<number>(1);
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);
  const [leaveActionError, setLeaveActionError] = useState<string>("");

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const [employees, departments, projects, pendingLeaves] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getProjects(),
        getPendingLeaves(),
      ]);

      setStatistics({
        employees: employees.length,
        departments: departments.length,
        projects: projects.length,
        pendingLeaves: pendingLeaves.length,
      });

      setPendingLeaveItems(
        pendingLeaves.map(
          (leave: unknown): Record<string, unknown> =>
            leave as Record<string, unknown>,
        ),
      );

    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load dashboard information.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleLeaveReview = useCallback(
    async (
      leave: Record<string, unknown>,
      action: "approve" | "reject",
    ): Promise<void> => {
      const leaveRequestId: string | null = getTextValue(leave, [
        "id",
        "leaveRequestId",
        "requestId",
      ]);

      if (!leaveRequestId) {
        setLeaveActionError("Unable to identify this leave request.");
        return;
      }

      setReviewingLeaveId(leaveRequestId);
      setLeaveActionError("");

      try {
        if (action === "approve") {
          await approveLeave(leaveRequestId);
        } else {
          // The reject API requires a non-empty comment.
          await rejectLeave(leaveRequestId, "Rejected by Super Admin");
        }

        await loadDashboard();
      } catch (actionError: unknown) {
        setLeaveActionError(
          actionError instanceof Error
            ? actionError.message
            : `Unable to ${action} leave request.`,
        );
      } finally {
        setReviewingLeaveId(null);
      }
    },
    [loadDashboard],
  );

  const chartData = useMemo(
    () =>
      CATEGORY_CONFIG.map((category) => ({
        name: category.label,
        value: statistics[category.key],
        color: category.color,
      })),
    [statistics],
  );

  const totalRecords: number =
    statistics.employees +
    statistics.departments +
    statistics.projects +
    statistics.pendingLeaves;

  const PENDING_LEAVES_PER_PAGE = 5;
  const pendingLeavePageCount: number = Math.max(
    1,
    Math.ceil(pendingLeaveItems.length / PENDING_LEAVES_PER_PAGE),
  );

  const paginatedPendingLeaves: Record<string, unknown>[] =
    pendingLeaveItems.slice(
      (pendingLeavePage - 1) * PENDING_LEAVES_PER_PAGE,
      pendingLeavePage * PENDING_LEAVES_PER_PAGE,
    );

  useEffect(() => {
    if (pendingLeavePage > pendingLeavePageCount) {
      setPendingLeavePage(pendingLeavePageCount);
    }
  }, [pendingLeavePage, pendingLeavePageCount]);

  return (
    <Box sx={{ bgcolor: "#F5F7FB", minHeight: "100%" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <DashboardHeader
            fullName={currentUser?.fullName}
            loading={loading}
            onRefresh={() => void loadDashboard()}
          />

          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <SectionHeading title="Overview" subtitle="Current system information." />

          <Grid container spacing={3}>
            {CATEGORY_CONFIG.map((category) => (
              <Grid key={category.key} size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryCard
                  title={category.label}
                  value={statistics[category.key]}
                  loading={loading}
                  icon={category.icon}
                  color={category.color}
                />
              </Grid>
            ))}
          </Grid>

          <SectionHeading
            title="Insights"
            subtitle="How records break down across the system."
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ChartCard title="Records by category" icon={<InsightsIcon fontSize="small" />}>
                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : totalRecords === 0 ? (
                  <EmptyChartState message="No records yet. Data will appear here once employees, departments, projects or leave requests are added." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} barSize={40}>
                      <CartesianGrid vertical={false} stroke={alpha("#0B1120", 0.06)} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        width={28}
                      />
                      <ChartTooltip
                        cursor={{ fill: alpha("#0B1120", 0.04) }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <ChartCard title="Share of total" icon={<InsightsIcon fontSize="small" />}>
                {loading ? (
                  <Skeleton variant="rounded" height={280} />
                ) : totalRecords === 0 ? (
                  <EmptyChartState message="Nothing to show yet." />
                ) : (
                  <Box sx={{ position: "relative" }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 800, color: "#0B1120" }}>
                        {totalRecords}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        total records
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Stack
                  direction="row"
                  sx={{
                    gap: 1,
                    mb: 2,
                    alignItems: "center",
                  }}
                >
                  {CATEGORY_CONFIG.map((category: CategoryConfig) => (
                    <Stack
                      key={category.key}
                      direction="row"
                      spacing={0.75}
                      sx={{ alignItems: "center" }}
                    >
                      <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: category.color }} />
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        {category.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </ChartCard>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <SectionHeading
              title="Pending Leaves"
              subtitle="Latest leave requests waiting for review."
            />

            {pendingLeaveItems.length > 5 && (
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/super-admin/leave-requests")}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                See more
              </Button>
            )}
          </Box>

          {leaveActionError && (
            <Alert severity="error" onClose={() => setLeaveActionError("")}>
              {leaveActionError}
            </Alert>
          )}

          <Card
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              boxShadow: "none",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <Box sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  {Array.from({ length: 3 }).map((_, index: number) => (
                    <Skeleton key={index} variant="rounded" height={64} />
                  ))}
                </Stack>
              </Box>
            ) : pendingLeaveItems.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <EventAvailableIcon sx={{ fontSize: 42, mb: 1, color: "#D97706" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0B1120" }}>
                  No pending leave requests
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  New pending requests will appear here.
                </Typography>
              </Box>
            ) : (
              <Stack divider={<Box sx={{ borderTop: "1px solid #E2E8F0" }} />}>
                {paginatedPendingLeaves.map(
                  (leave: Record<string, unknown>, index: number) => (
                    <Box
                      key={getLeaveKey(leave, index)}
                      sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        display: "flex",
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 2,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            width: 42,
                            height: 42,
                            bgcolor: alpha("#D97706", 0.12),
                            color: "#D97706",
                          }}
                        >
                          <EventAvailableIcon fontSize="small" />
                        </Avatar>

                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {getLeaveEmployeeLabel(leave)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getLeaveTypeLabel(leave)}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction={{ xs: "column", lg: "row" }}
                        spacing={{ xs: 1.5, lg: 3 }}
                        sx={{
                          minWidth: { lg: 520 },
                          alignItems: { xs: "stretch", lg: "center" },
                        }}
                      >
                        <Box sx={{ minWidth: 170 }}>
                          <Typography variant="caption" color="text.secondary">
                            Leave period
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getLeavePeriod(leave)}
                          </Typography>
                        </Box>

                        <Box sx={{ minWidth: 70 }}>
                          <Typography variant="caption" color="text.secondary">
                            Status
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "#D97706" }}
                          >
                            {getTextValue(leave, ["status"]) ?? "Pending"}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Button
                            type="button"
                            size="small"
                            variant="contained"
                            disabled={
                              reviewingLeaveId === getLeaveRequestId(leave)
                            }
                            onClick={() => void handleLeaveReview(leave, "approve")}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
                            }}
                          >
                            {reviewingLeaveId === getLeaveRequestId(leave)
                              ? "Processing..."
                              : "Approve"}
                          </Button>

                          <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={
                              reviewingLeaveId === getLeaveRequestId(leave)
                            }
                            onClick={() => void handleLeaveReview(leave, "reject")}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
                            }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ),
                )}
              </Stack>
            )}

            {!loading && pendingLeaveItems.length > PENDING_LEAVES_PER_PAGE && (
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  display: "flex",
                  justifyContent: "center",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Pagination
                  count={pendingLeavePageCount}
                  page={pendingLeavePage}
                  onChange={(_event, page: number): void =>
                    setPendingLeavePage(page)
                  }
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

interface DashboardHeaderProps {
  fullName?: string;
  loading: boolean;
  onRefresh: () => void;
}

function DashboardHeader({
  fullName,
  loading,
  onRefresh,
}: DashboardHeaderProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        background: "linear-gradient(120deg, #0B1120 0%, #1E1B4B 55%, #4F46E5 100%)",
        color: "common.white",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          opacity: 0.5,
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.75, letterSpacing: 2 }}>
              Employee Management System
            </Typography>

            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              Super Admin Dashboard
            </Typography>

            <Typography sx={{ mt: 1, opacity: 0.85, maxWidth: 640 }}>
              Welcome back, {fullName ?? "Super Admin"}. Manage employees, departments, projects,
              leave requests, user access and permissions from one place.
            </Typography>
          </Box>

          <Tooltip title="Refresh dashboard">
            <span>
              <IconButton
                disabled={loading}
                onClick={onRefresh}
                sx={{
                  bgcolor: "rgba(255,255,255,0.12)",
                  color: "common.white",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.20)" },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

      </Box>
    </Paper>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }): React.ReactElement {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0B1120" }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}): React.ReactElement {
  return (
    <Card sx={{ height: "100%", borderRadius: 3, border: 1, borderColor: "divider", boxShadow: "none" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, alignItems: "center" }}
>
          <Box sx={{ color: "#4F46E5", display: "flex" }}>{icon}</Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyChartState({ message }: { message: string }): React.ReactElement {
  return (
    <Box
      sx={{
        height: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "text.secondary",
        px: 4,
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}

function SummaryCard({ title, value, loading, icon, color }: SummaryCardProps): React.ReactElement {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        boxShadow: "none",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ width: 52, height: 52, bgcolor: alpha(color, 0.12), color }}>{icon}</Avatar>

        <Box>
          {loading ? (
            <Skeleton width={60} height={38} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#0B1120" }}>
              {value}
            </Typography>
          )}

          <Typography color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}


function getTextValue(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value: unknown = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function getLeaveRequestId(
  leave: Record<string, unknown>,
): string | null {
  return getTextValue(leave, ["id", "leaveRequestId", "requestId"]);
}

function getLeaveKey(
  leave: Record<string, unknown>,
  index: number,
): string {
  return (
    getTextValue(leave, ["id", "leaveRequestId", "requestId"]) ??
    `pending-leave-${index}`
  );
}

function getLeaveEmployeeLabel(
  leave: Record<string, unknown>,
): string {
  const directName: string | null = getTextValue(leave, [
    "employeeName",
    "fullName",
    "name",
  ]);

  if (directName) {
    return directName;
  }

  const employee: unknown = leave.employee;

  if (employee && typeof employee === "object") {
    const employeeRecord = employee as Record<string, unknown>;
    const fullName: string | null = getTextValue(employeeRecord, [
      "fullName",
      "name",
    ]);

    if (fullName) {
      return fullName;
    }

    const firstName: string | null = getTextValue(employeeRecord, ["firstName"]);
    const lastName: string | null = getTextValue(employeeRecord, ["lastName"]);

    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(" ");
    }
  }

  const employeeId: string | null = getTextValue(leave, ["employeeId"]);
  return employeeId ? `Employee #${employeeId}` : "Employee";
}

function getLeaveTypeLabel(
  leave: Record<string, unknown>,
): string {
  return (
    getTextValue(leave, [
      "leaveType",
      "policyName",
      "leavePolicyName",
      "reason",
    ]) ?? "Leave request"
  );
}

function getLeavePeriod(
  leave: Record<string, unknown>,
): string {
  const start: string | null = getTextValue(leave, ["startDate"]);
  const end: string | null = getTextValue(leave, ["endDate"]);

  if (!start && !end) {
    return "Date not available";
  }

  if (start && end) {
    return `${formatLeaveDate(start)} – ${formatLeaveDate(end)}`;
  }

  return formatLeaveDate(start ?? end ?? "");
}

function formatLeaveDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStoredUser(): StoredUser | null {
  const storedUserJson: string | null = localStorage.getItem("authUser");

  if (!storedUserJson) {
    return null;
  }

  try {
    const user = JSON.parse(storedUserJson) as StoredUser;

    if (user.role !== "SuperAdmin") {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}