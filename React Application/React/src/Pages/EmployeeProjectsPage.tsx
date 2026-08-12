import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderIcon from "@mui/icons-material/Folder";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { getEmployeeProjects } from "../services/employeeProjectService";
import { getProjects } from "../services/projectService";

import type { StoredUser } from "../Types/auth";
import type {
  EmployeeProject,
  Project,
} from "../Types/project";

type ProjectTab =
  | "all"
  | "ongoing"
  | "completed";

export default function EmployeeProjectsPage():
  React.ReactElement {
  const currentUser:
    StoredUser | null =
    getStoredUser();

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>([]);

  const [
    selectedTab,
    setSelectedTab,
  ] =
    useState<ProjectTab>(
      "all",
    );

  const [
    loading,
    setLoading,
  ] =
    useState<boolean>(true);

  const [
    error,
    setError,
  ] =
    useState<string>("");

  const loadProjects =
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
            assignments,
            allProjects,
          ] = await Promise.all([
            getEmployeeProjects(
              currentUser.employeeId,
            ),
            getProjects(),
          ]);

          const projectIds:
            Set<string> =
            new Set(
              assignments.map(
                (
                  assignment:
                    EmployeeProject,
                ): string =>
                  assignment.projectId,
              ),
            );

          setProjects(
            allProjects.filter(
              (
                project:
                  Project,
              ): boolean =>
                projectIds.has(
                  project.id,
                ),
            ),
          );
        } catch (
          caughtError: unknown
        ) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load your projects.",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        currentUser?.employeeId,
      ],
    );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const ongoingProjects:
    Project[] =
    useMemo(
      () =>
        projects.filter(
          (
            project:
              Project,
          ): boolean =>
            !isProjectCompleted(
              project,
            ),
        ),
      [projects],
    );

  const completedProjects:
    Project[] =
    useMemo(
      () =>
        projects.filter(
          (
            project:
              Project,
          ): boolean =>
            isProjectCompleted(
              project,
            ),
        ),
      [projects],
    );

  const visibleProjects:
    Project[] =
    useMemo(
      () => {
        if (
          selectedTab ===
          "ongoing"
        ) {
          return ongoingProjects;
        }

        if (
          selectedTab ===
          "completed"
        ) {
          return completedProjects;
        }

        return projects;
      },
      [
        selectedTab,
        projects,
        ongoingProjects,
        completedProjects,
      ],
    );

  return (
    <Box
      sx={{
        bgcolor: "#F8FAFC",
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
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 3,
                md: 4,
              },
              borderRadius: 3,
              background:
                "linear-gradient(135deg, #1976d2 0%, #512da8 100%)",
              color: "common.white",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: {
                  xs: "stretch",
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
                    opacity: 0.8,
                    letterSpacing:
                      1.5,
                  }}
                >
                  Project Management
                </Typography>

                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  My Projects
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                  }}
                >
                  View projects assigned
                  to you and projects
                  already completed.
                </Typography>
              </Box>

              <Chip
                icon={
                  loading ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <RefreshIcon />
                  )
                }
                label="Refresh"
                onClick={() =>
                  void loadProjects()
                }
                disabled={loading}
                sx={{
                  bgcolor:
                    "rgba(255,255,255,0.12)",
                  color:
                    "common.white",
                  border:
                    "1px solid rgba(255,255,255,0.5)",
                  "& .MuiChip-icon":
                    {
                      color:
                        "inherit",
                    },
                }}
              />
            </Box>
          </Paper>

          {error && (
            <Alert
              severity="error"
              onClose={() =>
                setError("")
              }
            >
              {error}
            </Alert>
          )}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <ProjectCountCard
            label="Assigned Projects"
            value={projects.length}
            icon={<FolderIcon />}
            iconColor="#5B5FEF"
            iconBackgroundColor="#EEEAFF"
            />

            <ProjectCountCard
            label="Ongoing Projects"
            value={ongoingProjects.length}
            icon={<RadioButtonUncheckedIcon />}
            iconColor="#7C3AED"
            iconBackgroundColor="#F1E8FF"
            />

            <ProjectCountCard
            label="Completed Projects"
            value={completedProjects.length}
            icon={<CheckCircleIcon />}
            iconColor="#16A34A"
            iconBackgroundColor="#E3F5E9"
            />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              border:
                "1px solid",
              borderColor:
                "divider",
              borderRadius: 3,
              overflow:
                "hidden",
            }}
          >
            <Box
              sx={{
                px: {
                  xs: 2,
                  sm: 3,
                },
                pt: 1,
                borderBottom:
                  "1px solid",
                borderColor:
                  "divider",
              }}
            >
              <Tabs
                value={
                  selectedTab
                }
                onChange={(
                  _event,
                  value:
                    ProjectTab,
                ): void =>
                  setSelectedTab(
                    value,
                  )
                }
              >
                <Tab
                  value="all"
                  label={`All (${projects.length})`}
                />
                <Tab
                  value="ongoing"
                  label={`Ongoing (${ongoingProjects.length})`}
                />
                <Tab
                  value="completed"
                  label={`Completed (${completedProjects.length})`}
                />
              </Tabs>
            </Box>

            {loading ? (
              <Box
                sx={{
                  minHeight: 300,
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : visibleProjects.length ===
              0 ? (
              <Box
                sx={{
                  py: 7,
                  px: 3,
                  textAlign:
                    "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  No projects found
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  No projects are
                  available in this
                  category.
                </Typography>
              </Box>
            ) : (
              <Stack
                spacing={0}
              >
                {visibleProjects.map(
                  (
                    project:
                      Project,
                  ) => (
                    <ProjectRow
                      key={
                        project.id
                      }
                      project={
                        project
                      }
                    />
                  ),
                )}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

interface ProjectCountCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBackgroundColor: string;
}

function ProjectCountCard({
  label,
  value,
  icon,
  iconColor,
  iconBackgroundColor,
}: ProjectCountCardProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: iconBackgroundColor,
            color: iconColor,
            "& svg": {
              color: "inherit",
            },
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
            }}
          >
            {value}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function ProjectRow({
  project,
}: {
  project: Project;
}): React.ReactElement {
  const completed:
    boolean =
    isProjectCompleted(
      project,
    );

  return (
    <Box
      sx={{
        px: {
          xs: 2,
          sm: 3,
        },
        py: 2.5,
        borderBottom:
          "1px solid",
        borderColor:
          "divider",
        "&:last-child": {
          borderBottom: 0,
        },
      }}
    >
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
        <Stack
          direction="row"
          spacing={2}
          sx={{
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems:
                  "center",
              }}
            >
              {completed ? (
                <CheckCircleIcon
                  fontSize="small"
                  color="success"
                />
              ) : (
                <RadioButtonUncheckedIcon
                  fontSize="small"
                  sx={{
                    color: "#7C3AED",
                  }}
                />
              )}

              <Typography
                sx={{
                  fontWeight:
                    700,
                }}
              >
                {project.name}
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.75,
              }}
            >
              {project.description?.trim() ||
                "No project description is available."}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display:
                  "block",
                mt: 1,
              }}
            >
              {formatProjectDates(
                project,
              )}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={
            completed
              ? "Completed"
              : "Ongoing"
          }
          color={
            completed
              ? "success"
              : "primary"
          }
          variant="outlined"
          size="small"
        />
      </Stack>
    </Box>
  );
}

function isProjectCompleted(
  project: Project,
): boolean {
  return (
    String(
      project.status ?? "",
    )
      .trim()
      .toLowerCase() ===
    "completed"
  );
}

function formatProjectDates(
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

  return `Start: ${start} · End: ${end}`;
}

function formatDate(
  value: string,
): string {
  const date:
    Date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString();
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