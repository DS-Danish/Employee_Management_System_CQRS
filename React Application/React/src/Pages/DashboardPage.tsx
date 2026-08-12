import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import InsightsIcon from "@mui/icons-material/Insights";
import RefreshIcon from "@mui/icons-material/Refresh";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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

import { getEmployeeProjects } from "../services/employeeProjectService";
import { getMyLeaveBalance } from "../services/leaveService";
import { completeProject, getProjects } from "../services/projectService";

import type { StoredUser } from "../Types/auth";
import { getLeaveTypeLabel, type LeaveBalance } from "../Types/leave";
import type {
  EmployeeProject,
  Project,
} from "../Types/project";

interface LeaveChartItem {
  name: string;
  value: number;
  color: string;
}

const ACCENT_INDIGO = "#4F46E5";
const ACCENT_VIOLET = "#7C3AED";
const ACCENT_AMBER = "#D97706";
const ACCENT_GREEN = "#16A34A";

export default function DashboardPage():
  React.ReactElement {
  const currentUser:
    StoredUser | null =
    getStoredUser();

  const [
    leaveBalances,
    setLeaveBalances,
  ] = useState<LeaveBalance[]>([]);

const [
    assignedProjects,
    setAssignedProjects,
  ] = useState<Project[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<string>("");

  const [
    completingProjectId,
    setCompletingProjectId,
  ] = useState<string | null>(null);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    error,
    setError,
  ] = useState<string>("");

  const currentYear: number =
    useMemo(
      () => new Date().getFullYear(),
      [],
    );

  const loadDashboard =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          if (
            !currentUser?.employeeId
          ) {
            throw new Error(
              "Your user account is not linked to an employee record.",
            );
          }

          const [
            leaveBalanceResult,
            projectAssignments,
            allProjects,
          ] = await Promise.all([
            getMyLeaveBalance(
              currentYear,
            ),
            getEmployeeProjects(
              currentUser.employeeId,
            ),
            getProjects(),
          ]);

          const projectIds =
            new Set<string>(
              projectAssignments.map(
                (
                  assignment:
                    EmployeeProject,
                ): string =>
                  assignment.projectId,
              ),
            );

          const employeeProjects:
            Project[] =
            allProjects.filter(
              (
                project:
                  Project,
              ): boolean =>
                projectIds.has(
                  project.id,
                ),
            );

          setLeaveBalances(
            leaveBalanceResult,
          );

          setAssignedProjects(
            employeeProjects,
          );

          setSelectedProjectId(
            (
              currentProjectId:
                string,
            ): string => {
              if (
                currentProjectId &&
                employeeProjects.some(
                  (
                    project:
                      Project,
                  ): boolean =>
                    project.id ===
                    currentProjectId,
                )
              ) {
                return currentProjectId;
              }

              return (
                employeeProjects[0]
                  ?.id ?? ""
              );
            },
          );
        } catch (
          caughtError: unknown
        ) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load dashboard information.",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        currentUser?.employeeId,
        currentYear,
      ],
    );

  async function handleCompleteProject(
    project: Project,
  ): Promise<void> {
    if (
      isProjectCompleted(project) ||
      completingProjectId === project.id
    ) {
      return;
    }

    setCompletingProjectId(
      project.id,
    );
    setError("");

    try {
      await completeProject(
        project.id,
      );

      setAssignedProjects(
        (
          currentProjects:
            Project[],
        ): Project[] =>
          currentProjects.map(
            (
              currentProject:
                Project,
            ): Project =>
              currentProject.id ===
              project.id
                ? {
                    ...currentProject,
                    status:
                      "Completed",
                  }
                : currentProject,
          ),
      );
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to mark the project as completed.",
      );
    } finally {
      setCompletingProjectId(
        null,
      );
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const leaveChartData:
    LeaveChartItem[] =
    useMemo(
      () => {
        const leaveTypes:
          Array<{
            name: string;
            color: string;
          }> = [
          {
            name: "Annual",
            color:
              ACCENT_INDIGO,
          },
          {
            name: "Casual",
            color:
              ACCENT_AMBER,
          },
          {
            name: "Sick",
            color:
              ACCENT_GREEN,
          },
        ];

        return leaveTypes.map(
          (
            leaveType: {
              name: string;
              color: string;
            },
          ): LeaveChartItem => {
            const balance:
              LeaveBalance | undefined =
              leaveBalances.find(
                (
                  item:
                    LeaveBalance,
                ): boolean =>
                  getLeaveTypeLabel(
                    item.leaveType,
                  )
                    .trim()
                    .toLowerCase() ===
                  leaveType.name
                    .toLowerCase(),
              );

            return {
              name:
                leaveType.name,
              value:
                balance?.remainingDays ??
                0,
              color:
                leaveType.color,
            };
          },
        );
      },
      [leaveBalances],
    );

  const totalRemainingLeaveDays:
    number =
    leaveChartData.reduce(
      (
        total: number,
        item: LeaveChartItem,
      ): number =>
        total + item.value,
      0,
    );

  const selectedProject:
    Project | null =
    useMemo(
      () =>
        assignedProjects.find(
          (
            project:
              Project,
          ): boolean =>
            project.id ===
            selectedProjectId,
        ) ?? null,
      [
        assignedProjects,
        selectedProjectId,
      ],
    );

  const projectProgress:
    number | null =
    useMemo(
      () =>
        selectedProject
          ? calculateProjectTimelineProgress(
              selectedProject,
            )
          : null,
      [selectedProject],
    );

return (
    <Box
      sx={{
        bgcolor: "#F5F7FB",
        minHeight: "100%",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          py: {
            xs: 3,
            md: 5,
          },
        }}
      >
        <Stack spacing={4}>
          <DashboardHeader
            fullName={
              currentUser?.fullName
            }
            loading={loading}
            onRefresh={() =>
              void loadDashboard()
            }
          />

          {error && (
            <Alert
              severity="error"
              onClose={() =>
                setError("")
              }
              sx={{
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <SectionHeading
            title="Insights"
            subtitle="Track your remaining leave balance and assigned project progress."
          />

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                lg: 6,
              }}
            >
              <ChartCard
                title="Remaining leave balance"
                icon={
                  <EventAvailableIcon
                    fontSize="small"
                  />
                }
              >
                {loading ? (
                  <Skeleton
                    variant="rounded"
                    height={300}
                  />
                ) : leaveBalances.length ===
                  0 ? (
                  <EmptyChartState
                    message="No leave balance information is available."
                  />
                ) : (
                  <>
                    <Box
                      sx={{
                        position:
                          "relative",
                      }}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height={260}
                      >
                        <PieChart>
                          <Pie
                            data={
                              leaveChartData
                            }
                            dataKey="value"
                            nameKey="name"
                            innerRadius={
                              65
                            }
                            outerRadius={
                              95
                            }
                            paddingAngle={
                              3
                            }
                            stroke="none"
                          >
                            {leaveChartData.map(
                              (
                                entry:
                                  LeaveChartItem,
                              ) => (
                                <Cell
                                  key={
                                    entry.name
                                  }
                                  fill={
                                    entry.color
                                  }
                                />
                              ),
                            )}
                          </Pie>

                          <ChartTooltip
                            contentStyle={{
                              borderRadius:
                                12,
                              border:
                                "1px solid #E2E8F0",
                              boxShadow:
                                "0 8px 24px rgba(15, 23, 42, 0.08)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <Box
                        sx={{
                          position:
                            "absolute",
                          top: "50%",
                          left: "50%",
                          transform:
                            "translate(-50%, -50%)",
                          textAlign:
                            "center",
                          pointerEvents:
                            "none",
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight:
                              800,
                            color:
                              "#0B1120",
                          }}
                        >
                          {
                            totalRemainingLeaveDays
                          }
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              "#64748B",
                          }}
                        >
                          days remaining
                        </Typography>
                      </Box>
                    </Box>

                    <Stack
                      direction="row"
                      sx={{
                        gap: 2,
                        flexWrap:
                          "wrap",
                        alignItems:
                          "center",
                      }}
                    >
                      {leaveChartData.map(
                        (
                          item:
                            LeaveChartItem,
                        ) => (
                          <Stack
                            key={
                              item.name
                            }
                            direction="row"
                            spacing={
                              0.75
                            }
                            sx={{
                              alignItems:
                                "center",
                            }}
                          >
                            <Box
                              sx={{
                                width:
                                  10,
                                height:
                                  10,
                                borderRadius:
                                  "3px",
                                bgcolor:
                                  item.color,
                              }}
                            />

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.name}
                              :{" "}
                              {
                                item.value
                              }{" "}
                              days
                            </Typography>
                          </Stack>
                        ),
                      )}
                    </Stack>
                  </>
                )}
              </ChartCard>
            </Grid>

            <Grid
              size={{
                xs: 12,
                lg: 6,
              }}
            >
              <ChartCard
                title="Project progress"
                icon={
                  <InsightsIcon
                    fontSize="small"
                  />
                }
              >
                {loading ? (
                  <Skeleton
                    variant="rounded"
                    height={300}
                  />
                ) : assignedProjects.length ===
                  0 ? (
                  <EmptyChartState
                    message="No project has been assigned to you yet."
                  />
                ) : (
                  <Stack
                    spacing={3}
                  >
                    {assignedProjects.length >=
                      2 && (
                      <FormControl
                        size="small"
                        sx={{
                          maxWidth:
                            340,
                        }}
                      >
                        <InputLabel
                          id="employee-project-select-label"
                        >
                          Project
                        </InputLabel>

                        <Select
                          labelId="employee-project-select-label"
                          value={
                            selectedProjectId
                          }
                          label="Project"
                          onChange={event =>
                            setSelectedProjectId(
                              String(
                                event
                                  .target
                                  .value,
                              ),
                            )
                          }
                        >
                          {assignedProjects.map(
                            (
                              project:
                                Project,
                            ) => (
                              <MenuItem
                                key={
                                  project.id
                                }
                                value={
                                  project.id
                                }
                              >
                                {
                                  project.name
                                }
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>
                    )}

                    {selectedProject && (
                      <>
                        <Stack
                          direction={{
                            xs: "column",
                            sm: "row",
                          }}
                          spacing={2}
                          sx={{
                            alignItems: {
                              xs: "flex-start",
                              sm: "center",
                            },
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight:
                                  700,
                              }}
                            >
                              {
                                selectedProject.name
                              }
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                              }}
                            >
                              {formatProjectPeriod(
                                selectedProject,
                              )}
                            </Typography>
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              alignItems:
                                "center",
                            }}
                          >
                            <Chip
                              label={
                                isProjectCompleted(
                                  selectedProject,
                                )
                                  ? "Completed"
                                  : "Ongoing"
                              }
                              color={
                                isProjectCompleted(
                                  selectedProject,
                                )
                                  ? "success"
                                  : "primary"
                              }
                              variant="outlined"
                            />

                            {!isProjectCompleted(
                              selectedProject,
                            ) && (
                              <Button
                                type="button"
                                size="small"
                                variant="contained"
                                color="success"
                                disableElevation
                                disabled={
                                  completingProjectId ===
                                  selectedProject.id
                                }
                                startIcon={
                                  completingProjectId ===
                                  selectedProject.id ? (
                                    <CircularProgress
                                      size={15}
                                      color="inherit"
                                    />
                                  ) : (
                                    <TaskAltIcon
                                      fontSize="small"
                                    />
                                  )
                                }
                                onClick={() =>
                                  void handleCompleteProject(
                                    selectedProject,
                                  )
                                }
                                sx={{
                                  borderRadius: 2,
                                  textTransform:
                                    "none",
                                  fontWeight: 700,
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {completingProjectId ===
                                selectedProject.id
                                  ? "Completing..."
                                  : "Mark Completed"}
                              </Button>
                            )}
                          </Stack>
                        </Stack>

                        {projectProgress ===
                        null ? (
                          <Box
                            sx={{
                              minHeight:
                                230,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              textAlign:
                                "center",
                              px: 3,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Timeline
                              progress is
                              unavailable
                              because this
                              project does
                              not have both
                              a start date
                              and an end
                              date.
                            </Typography>
                          </Box>
                        ) : (
                          <>
                            <ResponsiveContainer
                              width="100%"
                              height={
                                220
                              }
                            >
                              <BarChart
                                data={[
                                  {
                                    name:
                                      "Timeline",
                                    progress:
                                      projectProgress,
                                  },
                                ]}
                                layout="vertical"
                                margin={{
                                  top: 20,
                                  right:
                                    30,
                                  bottom:
                                    20,
                                  left: 10,
                                }}
                              >
                                <CartesianGrid
                                  horizontal={
                                    false
                                  }
                                  stroke={alpha(
                                    "#0B1120",
                                    0.06,
                                  )}
                                />

                                <XAxis
                                  type="number"
                                  domain={[
                                    0,
                                    100,
                                  ]}
                                  tickFormatter={(
                                    value:
                                      number,
                                  ): string =>
                                    `${value}%`
                                  }
                                  tickLine={
                                    false
                                  }
                                  axisLine={
                                    false
                                  }
                                  tick={{
                                    fontSize:
                                      12,
                                    fill:
                                      "#64748B",
                                  }}
                                />

                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  tickLine={
                                    false
                                  }
                                  axisLine={
                                    false
                                  }
                                  width={
                                    70
                                  }
                                  tick={{
                                    fontSize:
                                      12,
                                    fill:
                                      "#64748B",
                                  }}
                                />

                                <ChartTooltip
                                  formatter={(value) => [
                                    `${Number(value ?? 0)}%`,
                                    "Timeline progress",
                                  ]}
                                  contentStyle={{
                                    borderRadius:
                                      12,
                                    border:
                                      "1px solid #E2E8F0",
                                    boxShadow:
                                      "0 8px 24px rgba(15, 23, 42, 0.08)",
                                  }}
                                />

                                <Bar
                                  dataKey="progress"
                                  fill={
                                    ACCENT_VIOLET
                                  }
                                  radius={[
                                    0,
                                    8,
                                    8,
                                    0,
                                  ]}
                                  barSize={
                                    42
                                  }
                                />
                              </BarChart>
                            </ResponsiveContainer>

                            <Box
                              sx={{
                                p: 2,
                                borderRadius:
                                  2,
                                bgcolor:
                                  alpha(
                                    ACCENT_VIOLET,
                                    0.06,
                                  ),
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight:
                                    700,
                                  color:
                                    "#0B1120",
                                }}
                              >
                                {
                                  projectProgress
                                }
                                % timeline
                                progress
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Calculated
                                from the
                                project start
                                and end dates.
                                This is
                                timeline
                                progress, not
                                task-completion
                                progress.
                              </Typography>
                            </Box>
                          </>
                        )}
                      </>
                    )}
                  </Stack>
                )}
              </ChartCard>
            </Grid>
          </Grid>

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
}: DashboardHeaderProps):
  React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: {
          xs: 3,
          md: 4,
        },
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
          backgroundSize:
            "18px 18px",
          opacity: 0.5,
          pointerEvents:
            "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                opacity: 0.75,
                letterSpacing: 2,
              }}
            >
              Employee Management
              System
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.5,
              }}
            >
              Employee Dashboard
            </Typography>

            <Typography
              sx={{
                mt: 1,
                opacity: 0.85,
                maxWidth: 640,
              }}
            >
              Welcome back,{" "}
              {fullName ??
                "Employee"}.
              Track your leave requests
              and assigned projects from
              one place.
            </Typography>
          </Box>

          <Tooltip
            title="Refresh dashboard"
          >
            <span>
              <IconButton
                disabled={loading}
                onClick={onRefresh}
                sx={{
                  bgcolor:
                    "rgba(255,255,255,0.12)",
                  color:
                    "common.white",
                  "&:hover": {
                    bgcolor:
                      "rgba(255,255,255,0.20)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={22}
                    color="inherit"
                  />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}): React.ReactElement {
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#0B1120",
        }}
      >
        {title}
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
        }}
      >
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
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: 1,
        borderColor:
          "divider",
        boxShadow: "none",
      }}
    >
      <CardContent
        sx={{
          p: 3,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mb: 2,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              color:
                ACCENT_INDIGO,
              display: "flex",
            }}
          >
            {icon}
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
            }}
          >
            {title}
          </Typography>
        </Stack>

        {children}
      </CardContent>
    </Card>
  );
}

function EmptyChartState({
  message,
}: {
  message: string;
}): React.ReactElement {
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
      <Typography
        variant="body2"
      >
        {message}
      </Typography>
    </Box>
  );
}

function isProjectCompleted(
  project: Project,
): boolean {
  const record =
    project as Project &
      Record<string, unknown>;

  const status: unknown =
    record["status"];

  if (
    typeof status === "string"
  ) {
    return (
      status
        .trim()
        .toLowerCase() ===
      "completed"
    );
  }

  return false;
}

function calculateProjectTimelineProgress(
  project: Project,
): number | null {
  if (
    isProjectCompleted(project)
  ) {
    return 100;
  }

  const startDateValue:
    string | undefined =
    project.startDate;

  const endDateValue:
    string | null | undefined =
    project.endDate;

  if (
    !startDateValue ||
    !endDateValue
  ) {
    return null;
  }

  const startDate: Date =
    new Date(startDateValue);

  const endDate: Date =
    new Date(endDateValue);

  const now: Date =
    new Date();

  const start:
    number =
    startDate.getTime();

  const end:
    number =
    endDate.getTime();

  const current:
    number =
    now.getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return null;
  }

  const progress:
    number =
    ((current - start) /
      (end - start)) *
    100;

  return Math.round(
    Math.min(
      100,
      Math.max(
        0,
        progress,
      ),
    ),
  );
}

function formatProjectPeriod(
  project: Project,
): string {
  const start:
    string =
    project.startDate
      ? formatDate(
          project.startDate,
        )
      : "No start date";

  const end:
    string =
    project.endDate
      ? formatDate(
          project.endDate,
        )
      : "No end date";

  return `${start} – ${end}`;
}

function formatDate(
  value: string,
): string {
  const date: Date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function getStoredUser():
  StoredUser | null {
  const storedUserJson:
    string | null =
    localStorage.getItem(
      "authUser",
    );

  if (!storedUserJson) {
    return null;
  }

  try {
    const user:
      StoredUser =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;

    return user.role ===
      "Employee"
      ? user
      : null;
  } catch {
    return null;
  }
}