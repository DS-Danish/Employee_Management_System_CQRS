import { useCallback, useEffect, useMemo, useState } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import WorkIcon from "@mui/icons-material/Work";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";

import { completeProject, getProjects } from "../services/projectService";

import type { StoredUser } from "../Types/auth";
import type { Project } from "../Types/project";

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

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ongoing");
  const [loading, setLoading] = useState<boolean>(true);
  const [completingProjectId, setCompletingProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

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

  const totalProjectCount: number = projects.length;
  const totalOngoingCount: number = projects.filter((project) => !isCompleted(project)).length;
  const totalCompletedCount: number = projects.filter((project) => isCompleted(project)).length;

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "#F5F7FB" }}>
      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(PROJECT_ACCENT, 0.12),
                color: PROJECT_ACCENT,
                flexShrink: 0,
              }}
            >
              <WorkIcon />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                Projects
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                View project information and current completion status.
              </Typography>
            </Box>

            <Tooltip title="Refresh projects">
              <span>
                <IconButton
                  type="button"
                  aria-label="Refresh projects"
                  disabled={loading}
                  onClick={() => void loadProjects()}
                  sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
                >
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <ProjectStat
              icon={<WorkIcon />}
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

            <Box sx={{ p: 2 }}>
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
                  {visibleProjects.map((project: Project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      canComplete={canCompleteProjects}
                      completing={completingProjectId === project.id}
                      onComplete={() => void handleCompleteProject(project)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Stack>
      </Container>

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
  icon: React.ReactNode;
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
  completing: boolean;
  onComplete: () => void;
}

function ProjectRow({ project, canComplete, completing, onComplete }: ProjectRowProps): React.ReactElement {
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
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: statusColor,
            bgcolor: alpha(statusColor, completed ? 0.12 : 0.08),
          }}
        >
          {completed ? <CheckCircleIcon /> : <WorkIcon />}
        </Box>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {getProjectName(project)}
            </Typography>

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
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          bgcolor: alpha(PROJECT_ACCENT, 0.1),
          color: PROJECT_ACCENT,
        }}
      >
        <WorkIcon sx={{ fontSize: 28 }} />
      </Box>

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