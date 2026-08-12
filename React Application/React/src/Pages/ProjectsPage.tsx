import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FolderIcon from "@mui/icons-material/Folder";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SearchIcon from "@mui/icons-material/Search";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Container,
  InputAdornment,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from "@mui/material";

import { completeProject, getProjects } from "../services/projectService";
import { getEmployees } from "../services/employeeService";
import {
  assignEmployeeToProject,
  getEmployeeProjects,
  removeEmployeeFromProject,
} from "../services/employeeProjectService";

import type { StoredUser } from "../Types/auth";
import type { Employee } from "../Types/employee";
import type { EmployeeProject, Project } from "../Types/project";

// Projects are the "violet" category everywhere else in the app.
// Completion is a status, not a category, so it gets its own semantic green.
const PROJECT_ACCENT = "#7C3AED";
const COMPLETED_ACCENT = "#16A34A";
const TOTAL_ACCENT = "#4F46E5";

type StatusTab = "ongoing" | "completed" | "all";

function getProjectName(project: Project): string {
  return project.name?.trim() || "Unnamed project";
}

function getProjectDescription(project: Project): string {
  return project.description?.trim() || "No project description is available.";
}

function isCompleted(project: Project): boolean {
  return project.status === "Completed";
}

export function ProjectsPage(): React.ReactElement {
  const currentUser: StoredUser | null = getStoredUser();

  const canCompleteProjects: boolean =
    currentUser?.role === "TeamLead" || currentUser?.role === "SuperAdmin";

  const canAssignProjects: boolean =
    currentUser?.role === "TeamLead" || currentUser?.role === "SuperAdmin";

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ongoing");
  const [visibleProjectCount, setVisibleProjectCount] = useState<number>(10);
  const scrollContainerRef =
    useRef<HTMLDivElement | null>(null);

  const loadMoreTriggerRef =
    useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [completingProjectId, setCompletingProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [assignmentProject, setAssignmentProject] =
    useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] =
    useState<Set<string>>(new Set());
  const [initialEmployeeIds, setInitialEmployeeIds] =
    useState<Set<string>>(new Set());
  const [loadingAssignments, setLoadingAssignments] =
    useState<boolean>(false);
  const [savingAssignments, setSavingAssignments] =
    useState<boolean>(false);

  const loadProjects = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const result: Project[] = await getProjects();
      setProjects(result);
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error ? caughtError.message : "Unable to load projects.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function handleOpenAssignments(
    project: Project,
  ): Promise<void> {
    if (!canAssignProjects) {
      return;
    }

    setAssignmentProject(project);
    setLoadingAssignments(true);
    setError("");

    try {
      const employeeResult: Employee[] =
        await getEmployees();

      const assignmentResults: EmployeeProject[][] =
        await Promise.all(
          employeeResult.map(
            (employee: Employee): Promise<EmployeeProject[]> =>
              getEmployeeProjects(employee.id),
          ),
        );

      const assignedIds: Set<string> =
        new Set<string>();

      employeeResult.forEach(
        (employee: Employee, index: number): void => {
          const assignments: EmployeeProject[] =
            assignmentResults[index] ?? [];

          if (
            assignments.some(
              (assignment: EmployeeProject): boolean =>
                assignment.projectId === project.id,
            )
          ) {
            assignedIds.add(employee.id);
          }
        },
      );

      setEmployees(employeeResult);
      setSelectedEmployeeIds(
        new Set<string>(assignedIds),
      );
      setInitialEmployeeIds(
        new Set<string>(assignedIds),
      );
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load project assignments.",
      );
      setAssignmentProject(null);
    } finally {
      setLoadingAssignments(false);
    }
  }

  function handleToggleEmployee(
    employeeId: string,
  ): void {
    setSelectedEmployeeIds(
      (
        currentIds: Set<string>,
      ): Set<string> => {
        const nextIds: Set<string> =
          new Set<string>(currentIds);

        if (nextIds.has(employeeId)) {
          nextIds.delete(employeeId);
        } else {
          nextIds.add(employeeId);
        }

        return nextIds;
      },
    );
  }

  async function handleSaveAssignments(): Promise<void> {
    if (
      !assignmentProject ||
      !canAssignProjects
    ) {
      return;
    }

    setSavingAssignments(true);
    setError("");

    try {
      const employeeIdsToAdd: string[] =
        Array.from(selectedEmployeeIds).filter(
          (employeeId: string): boolean =>
            !initialEmployeeIds.has(employeeId),
        );

      const employeeIdsToRemove: string[] =
        Array.from(initialEmployeeIds).filter(
          (employeeId: string): boolean =>
            !selectedEmployeeIds.has(employeeId),
        );

      await Promise.all([
        ...employeeIdsToAdd.map(
          (employeeId: string): Promise<void> =>
            assignEmployeeToProject(
              employeeId,
              assignmentProject.id,
            ),
        ),
        ...employeeIdsToRemove.map(
          (employeeId: string): Promise<void> =>
            removeEmployeeFromProject(
              employeeId,
              assignmentProject.id,
            ),
        ),
      ]);

      setSuccessMessage(
        `Assignments updated for ${getProjectName(assignmentProject)}.`,
      );
      setAssignmentProject(null);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update project assignments.",
      );
    } finally {
      setSavingAssignments(false);
    }
  }

  async function handleCompleteProject(project: Project): Promise<void> {
    if (!canCompleteProjects || isCompleted(project)) {
      return;
    }

    setCompletingProjectId(project.id);
    setError("");

    try {
      await completeProject(project.id);

      setProjects((currentProjects: Project[]): Project[] =>
        currentProjects.map((currentProject: Project): Project =>
          currentProject.id === project.id
            ? { ...currentProject, status: "Completed" }
            : currentProject,
        ),
      );

      setSuccessMessage(`${getProjectName(project)} marked as completed.`);
    } catch (caughtError: unknown) {
      const message: string =
        caughtError instanceof Error ? caughtError.message : "Unable to complete the project.";

      setError(message);
    } finally {
      setCompletingProjectId(null);
    }
  }

  const searchFilteredProjects: Project[] = useMemo((): Project[] => {
    const normalizedSearch: string = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return projects;
    }

    return projects.filter((project: Project): boolean => {
      const name: string = getProjectName(project).toLowerCase();
      const description: string = getProjectDescription(project).toLowerCase();
      const status: string = project.status.toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        status.includes(normalizedSearch)
      );
    });
  }, [projects, search]);

  const ongoingProjects: Project[] = useMemo(
    () => searchFilteredProjects.filter((project: Project): boolean => !isCompleted(project)),
    [searchFilteredProjects],
  );

  const completedProjects: Project[] = useMemo(
    () => searchFilteredProjects.filter((project: Project): boolean => isCompleted(project)),
    [searchFilteredProjects],
  );

  const visibleProjects: Project[] =
    statusTab === "ongoing"
      ? ongoingProjects
      : statusTab === "completed"
        ? completedProjects
        : searchFilteredProjects;

  const PROJECTS_PER_BATCH = 10;

  const displayedProjects: Project[] =
    visibleProjects.slice(
      0,
      visibleProjectCount,
    );

  const hasMoreProjects: boolean =
    visibleProjectCount <
    visibleProjects.length;

  useEffect(() => {
    setVisibleProjectCount(
      PROJECTS_PER_BATCH,
    );
  }, [search, statusTab]);

  useEffect(() => {
    const trigger: HTMLDivElement | null =
      loadMoreTriggerRef.current;

    if (
      !trigger ||
      !hasMoreProjects
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (
          entries:
            IntersectionObserverEntry[],
        ): void => {
          const entry:
            IntersectionObserverEntry | undefined =
            entries[0];

          if (
            entry?.isIntersecting
          ) {
            setVisibleProjectCount(
              (
                currentCount:
                  number,
              ): number =>
                Math.min(
                  currentCount +
                    PROJECTS_PER_BATCH,
                  visibleProjects.length,
                ),
            );
          }
        },
        {
          root:
            scrollContainerRef.current,
          rootMargin:
            "150px 0px",
          threshold: 0.1,
        },
      );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [
    hasMoreProjects,
    visibleProjects.length,
  ]);

  const totalProjectCount: number = projects.length;
  const totalOngoingCount: number = projects.filter((project) => !isCompleted(project)).length;
  const totalCompletedCount: number = projects.filter((project) => isCompleted(project)).length;

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "#F8FAFC" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: "linear-gradient(135deg, #1976d2 0%, #512da8 100%)",
              color: "common.white",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ opacity: 0.8, letterSpacing: 1.5 }}
                >
                  Project Management
                </Typography>

                <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                  Projects
                </Typography>

                <Typography sx={{ mt: 1, opacity: 0.9 }}>
                  View project information and current completion status.
                </Typography>
              </Box>

              <Button
                type="button"
                variant="outlined"
                startIcon={<RefreshIcon />}
                disabled={loading}
                onClick={() => void loadProjects()}
                sx={{
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.6)",
                  alignSelf: { xs: "flex-start", sm: "center" },
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <ProjectStat
              icon={<FolderIcon />}
              label="Total projects"
              value={totalProjectCount}
              loading={loading}
              color={TOTAL_ACCENT}
            />

            <ProjectStat
              icon={<RadioButtonUncheckedIcon />}
              label="Ongoing"
              value={totalOngoingCount}
              loading={loading}
              color={PROJECT_ACCENT}
            />

            <ProjectStat
              icon={<CheckCircleIcon />}
              label="Completed"
              value={totalCompletedCount}
              loading={loading}
              color={COMPLETED_ACCENT}
            />
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{
                p: 2,
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Tabs
                value={statusTab}
                onChange={(_event, value: StatusTab) => setStatusTab(value)}
                sx={{
                  minHeight: 40,
                  "& .MuiTabs-indicator": { bgcolor: PROJECT_ACCENT },
                  "& .Mui-selected": { color: `${PROJECT_ACCENT} !important` },
                }}
              >
                <Tab
                  value="ongoing"
                  label={`Ongoing (${ongoingProjects.length})`}
                  sx={{ minHeight: 40, textTransform: "none", fontWeight: 600 }}
                />
                <Tab
                  value="completed"
                  label={`Completed (${completedProjects.length})`}
                  sx={{ minHeight: 40, textTransform: "none", fontWeight: 600 }}
                />
                <Tab
                  value="all"
                  label={`All (${searchFilteredProjects.length})`}
                  sx={{ minHeight: 40, textTransform: "none", fontWeight: 600 }}
                />
              </Tabs>

              <TextField
                value={search}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(event.target.value)
                }
                placeholder="Search projects or status"
                size="small"
                sx={{ width: { xs: "100%", md: 320 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            <Box
              ref={scrollContainerRef}
              sx={{
                p: 2,
                maxHeight: {
                  xs: "58vh",
                  md: "56vh",
                },
                overflowY: "auto",
                overscrollBehavior: "contain",
                scrollbarGutter: "stable",
              }}
            >
              {loading ? (
                <Stack spacing={1.5}>
                  {Array.from({ length: 4 }).map((_, index: number) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Skeleton variant="circular" width={44} height={44} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton width="35%" height={28} />
                          <Skeleton width="70%" />
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : visibleProjects.length === 0 ? (
                <EmptyProjectsState hasAnyProjects={projects.length > 0} statusTab={statusTab} />
              ) : (
                <Stack spacing={1.5}>
                  {displayedProjects.map((project: Project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      canComplete={canCompleteProjects}
                      canAssign={canAssignProjects}
                      completing={completingProjectId === project.id}
                      onComplete={() => void handleCompleteProject(project)}
                      onAssign={() => void handleOpenAssignments(project)}
                    />
                  ))}
                </Stack>
              )}

              {!loading &&
                visibleProjects.length > 0 && (
                  <Box
                    ref={loadMoreTriggerRef}
                    sx={{
                      minHeight: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pt: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {hasMoreProjects
                        ? "Scroll to load more projects"
                        : "All projects loaded"}
                    </Typography>
                  </Box>
                )}
            </Box>
          </Paper>
        </Stack>
      </Container>

      <Dialog
        open={Boolean(assignmentProject)}
        onClose={() => {
          if (!savingAssignments) {
            setAssignmentProject(null);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Assign Employees
        </DialogTitle>

        <DialogContent dividers>
          {assignmentProject && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Project:{" "}
              <Box
                component="span"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                }}
              >
                {getProjectName(assignmentProject)}
              </Box>
            </Typography>
          )}

          {loadingAssignments ? (
            <Box
              sx={{
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : employees.length === 0 ? (
            <Typography color="text.secondary">
              No employees are available.
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {employees.map(
                (employee: Employee) => (
                  <FormControlLabel
                    key={employee.id}
                    control={
                      <Checkbox
                        checked={selectedEmployeeIds.has(
                          employee.id,
                        )}
                        onChange={() =>
                          handleToggleEmployee(
                            employee.id,
                          )
                        }
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                        >
                          {employee.fullName}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {employee.email}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      m: 0,
                      px: 1,
                      py: 0.75,
                      borderRadius: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  />
                ),
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            type="button"
            onClick={() =>
              setAssignmentProject(null)
            }
            disabled={savingAssignments}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            disableElevation
            disabled={
              loadingAssignments ||
              savingAssignments
            }
            onClick={() =>
              void handleSaveAssignments()
            }
          >
            {savingAssignments
              ? "Saving..."
              : "Save Assignments"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
          sx={{ borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

interface ProjectStatProps {
  icon?: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  color: string;
}

function ProjectStat({ icon, label, value, loading, color }: ProjectStatProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.75,
        py: 2.25,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 2.5,
        flex: 1,
        minWidth: 200,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(color, 0.12),
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}

      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <Skeleton width={40} height={32} />
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.5 }}>
            {value}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

interface ProjectRowProps {
  project: Project;
  canComplete: boolean;
  canAssign: boolean;
  completing: boolean;
  onComplete: () => void;
  onAssign: () => void;
}

function ProjectRow({
  project,
  canComplete,
  canAssign,
  completing,
  onComplete,
  onAssign,
}: ProjectRowProps): React.ReactElement {
  const completed: boolean = isCompleted(project);
  const statusColor: string = completed ? COMPLETED_ACCENT : PROJECT_ACCENT;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        borderColor: completed ? alpha(COMPLETED_ACCENT, 0.25) : "divider",
        bgcolor: completed ? alpha(COMPLETED_ACCENT, 0.03) : "background.paper",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
        "&:hover": {
          borderColor: alpha(statusColor, 0.4),
          boxShadow: `0 4px 16px ${alpha(statusColor, 0.1)}`,
        },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: statusColor,
                  flexShrink: 0,
                }}
              >
                {completed ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon fontSize="small" />
                )}
              </Box>

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  minWidth: 0,
                }}
              >
                {getProjectName(project)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: statusColor,
                  bgcolor: alpha(statusColor, 0.1),
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 1.5,
                }}
              >
                {project.status}
              </Typography>

              {canAssign && (
                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  startIcon={
                    <GroupAddIcon fontSize="small" />
                  }
                  onClick={onAssign}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Assign Employees
                </Button>
              )}

              {canComplete && !completed && (
                <Button
                  type="button"
                  size="small"
                  variant="contained"
                  color="success"
                  disableElevation
                  disabled={completing}
                  onClick={onComplete}
                  startIcon={
                    completing ? (
                      <CircularProgress size={15} color="inherit" />
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )
                  }
                  sx={{
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {completing ? "Completing..." : "Mark Completed"}
                </Button>
              )}
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {getProjectDescription(project)}
          </Typography>

          {(project.startDate || project.endDate) && (
            <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap" }}>
              {project.startDate && (
                <Typography variant="caption" color="text.secondary">
                  Start: {formatDate(project.startDate)}
                </Typography>
              )}

              {project.endDate && (
                <Typography variant="caption" color="text.secondary">
                  End: {formatDate(project.endDate)}
                </Typography>
              )}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function EmptyProjectsState({
  hasAnyProjects,
  statusTab,
}: {
  hasAnyProjects: boolean;
  statusTab: StatusTab;
}): React.ReactElement {
  const title: string = !hasAnyProjects
    ? "No projects available"
    : statusTab === "ongoing"
      ? "No ongoing projects"
      : statusTab === "completed"
        ? "No completed projects"
        : "No matching projects";

  const description: string = !hasAnyProjects
    ? "Projects will appear here after they are added."
    : "Try another search, or switch tabs to see projects in a different status.";

  return (
    <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 420, mx: "auto" }}>
        {description}
      </Typography>
    </Box>
  );
}

function getStoredUser(): StoredUser | null {
  const storedUserJson: string | null = localStorage.getItem("authUser");

  if (!storedUserJson) {
    return null;
  }

  try {
    return JSON.parse(storedUserJson) as StoredUser;
  } catch {
    return null;
  }
}

function formatDate(value: string): string {
  const date: Date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}