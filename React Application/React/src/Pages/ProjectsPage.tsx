import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import WorkIcon from "@mui/icons-material/Work";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  completeProject,
  getProjects,
} from "../services/projectService";

import type {
  StoredUser,
} from "../Types/auth";

import type {
  Project,
} from "../Types/project";

function getProjectName(
  project: Project,
): string {
  return (
    project.name?.trim() ||
    "Unnamed project"
  );
}

function getProjectDescription(
  project: Project,
): string {
  return (
    project.description?.trim() ||
    "No project description is available."
  );
}

export function ProjectsPage():
  React.ReactElement {
  const currentUser: StoredUser | null =
    getStoredUser();

  const canCompleteProjects: boolean =
    currentUser?.role === "TeamLead" ||
    currentUser?.role === "SuperAdmin";

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    search,
    setSearch,
  ] = useState<string>("");

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    completingProjectId,
    setCompletingProjectId,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const loadProjects =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const result: Project[] =
            await getProjects();

          setProjects(result);
        } catch (
          caughtError: unknown
        ) {
          const message: string =
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load projects.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function handleCompleteProject(
    project: Project,
  ): Promise<void> {
    if (
      !canCompleteProjects ||
      project.status === "Completed"
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

      setProjects(
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

      setSuccessMessage(
        `${getProjectName(
          project,
        )} marked as completed.`,
      );
    } catch (
      caughtError: unknown
    ) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to complete the project.";

      setError(message);
    } finally {
      setCompletingProjectId(
        null,
      );
    }
  }

  const filteredProjects:
    Project[] =
    useMemo(
      (): Project[] => {
        const normalizedSearch:
          string =
          search
            .trim()
            .toLowerCase();

        if (!normalizedSearch) {
          return projects;
        }

        return projects.filter(
          (
            project: Project,
          ): boolean => {
            const name: string =
              getProjectName(
                project,
              ).toLowerCase();

            const description:
              string =
              getProjectDescription(
                project,
              ).toLowerCase();

            const status: string =
              project.status
                .toLowerCase();

            return (
              name.includes(
                normalizedSearch,
              ) ||
              description.includes(
                normalizedSearch,
              ) ||
              status.includes(
                normalizedSearch,
              )
            );
          },
        );
      },
      [
        projects,
        search,
      ],
    );

  const activeProjectCount: number =
    projects.filter(
      (
        project: Project,
      ): boolean =>
        project.status ===
        "Active",
    ).length;

  const completedProjectCount:
    number =
    projects.filter(
      (
        project: Project,
      ): boolean =>
        project.status ===
        "Completed",
    ).length;

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "#F8FAFC",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          py: 5,
        }}
      >
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2.5,
                sm: 3.5,
              },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #F7F7FB 100%)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    letterSpacing:
                      -0.6,
                  }}
                >
                  Projects
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  View project
                  information and
                  current completion
                  status.
                </Typography>
              </Box>

              <Tooltip title="Refresh projects">
                <span>
                  <IconButton
                    type="button"
                    aria-label="Refresh projects"
                    disabled={loading}
                    onClick={() =>
                      void loadProjects()
                    }
                    sx={{
                      alignSelf: {
                        xs:
                          "flex-start",
                        sm: "center",
                      },
                      border:
                        "1px solid",
                      borderColor:
                        "divider",
                      bgcolor:
                        "background.paper",
                    }}
                  >
                    {loading ? (
                      <CircularProgress
                        size={22}
                      />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor:
                "divider",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
              sx={{
                alignItems: {
                  xs: "stretch",
                  md: "center",
                },
                justifyContent:
                  "space-between",
              }}
            >
              <TextField
                value={search}
                onChange={(
                  event:
                    React.ChangeEvent<HTMLInputElement>,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search projects or status"
                size="small"
                sx={{
                  width: {
                    xs: "100%",
                    md: 360,
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  icon={<WorkIcon />}
                  label={`${
                    projects.length
                  } project${
                    projects.length ===
                    1
                      ? ""
                      : "s"
                  }`}
                  variant="outlined"
                />

                <Chip
                  label={`${activeProjectCount} Active`}
                  color="primary"
                  variant="outlined"
                />

                <Chip
                  label={`${completedProjectCount} Completed`}
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Paper>

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

          {loading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  {
                    xs: "1fr",
                    sm:
                      "repeat(2, 1fr)",
                    lg:
                      "repeat(3, 1fr)",
                  },
                gap: 2,
              }}
            >
              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index: number,
                ) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius:
                        3,
                    }}
                  >
                    <Skeleton
                      variant="circular"
                      width={48}
                      height={48}
                    />

                    <Skeleton
                      width="65%"
                      height={32}
                      sx={{
                        mt: 2,
                      }}
                    />

                    <Skeleton width="100%" />

                    <Skeleton width="85%" />
                  </Paper>
                ),
              )}
            </Box>
          ) : filteredProjects.length ===
            0 ? (
            <Paper
              variant="outlined"
              sx={{
                py: 8,
                px: 3,
                textAlign:
                  "center",
                borderRadius: 3,
                borderStyle:
                  "dashed",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor:
                    "#EDE9FE",
                  color:
                    "#7C3AED",
                }}
              >
                <WorkIcon
                  sx={{
                    fontSize:
                      32,
                  }}
                />
              </Avatar>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                {projects.length ===
                0
                  ? "No projects available"
                  : "No matching projects"}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  maxWidth: 420,
                  mx: "auto",
                }}
              >
                {projects.length ===
                0
                  ? "Projects will appear here after they are added."
                  : "Try searching with another project name, description or status."}
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  {
                    xs: "1fr",
                    sm:
                      "repeat(2, 1fr)",
                    lg:
                      "repeat(3, 1fr)",
                  },
                gap: 2,
              }}
            >
              {filteredProjects.map(
                (
                  project:
                    Project,
                ) => {
                  const isCompleted:
                    boolean =
                    project.status ===
                    "Completed";

                  const isCompleting:
                    boolean =
                    completingProjectId ===
                    project.id;

                  return (
                    <Paper
                      key={
                        project.id
                      }
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius:
                          3,
                        border:
                          "1px solid",
                        borderColor:
                          "divider",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        transition:
                          "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",

                        "&:hover":
                          {
                            transform:
                              "translateY(-2px)",
                            boxShadow:
                              "0 8px 24px rgba(15, 23, 42, 0.08)",
                            borderColor:
                              "primary.light",
                          },
                      }}
                    >
                      <Box
                        sx={{
                          display:
                            "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor:
                              isCompleted
                                ? "success.50"
                                : "#EDE9FE",
                            color:
                              isCompleted
                                ? "success.main"
                                : "#7C3AED",
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon />
                          ) : (
                            <WorkIcon />
                          )}
                        </Avatar>

                        <Chip
                          size="small"
                          label={
                            project.status
                          }
                          color={
                            isCompleted
                              ? "success"
                              : "primary"
                          }
                          variant={
                            isCompleted
                              ? "filled"
                              : "outlined"
                          }
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight:
                            700,
                          mb: 1,
                        }}
                      >
                        {getProjectName(
                          project,
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          minHeight:
                            44,
                          lineHeight:
                            1.6,
                          flexGrow: 1,
                        }}
                      >
                        {getProjectDescription(
                          project,
                        )}
                      </Typography>

                      {(project.startDate ||
                        project.endDate) && (
                        <Box
                          sx={{
                            mt: 2,
                          }}
                        >
                          {project.startDate && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                              }}
                            >
                              Start:{" "}
                              {formatDate(
                                project.startDate,
                              )}
                            </Typography>
                          )}

                          {project.endDate && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                              }}
                            >
                              Start:{" "}
                              {formatDate(
                                project.endDate,
                              )}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {canCompleteProjects &&
                        !isCompleted && (
                          <Button
                            type="button"
                            variant="contained"
                            color="success"
                            disableElevation
                            startIcon={
                              isCompleting ? (
                                <CircularProgress
                                  size={
                                    18
                                  }
                                  color="inherit"
                                />
                              ) : (
                                <CheckCircleIcon />
                              )
                            }
                            disabled={
                              isCompleting
                            }
                            onClick={() =>
                              void handleCompleteProject(
                                project,
                              )
                            }
                            sx={{
                              mt: 3,
                              alignSelf:
                                "flex-start",
                              borderRadius:
                                2,
                            }}
                          >
                            {isCompleting
                              ? "Completing..."
                              : "Mark Completed"}
                          </Button>
                        )}
                    </Paper>
                  );
                },
              )}
            </Box>
          )}
        </Stack>
      </Container>

      <Snackbar
        open={Boolean(
          successMessage,
        )}
        autoHideDuration={4000}
        onClose={() =>
          setSuccessMessage("")
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
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
    return JSON.parse(
      storedUserJson,
    ) as StoredUser;
  } catch {
    return null;
  }
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

  return date.toLocaleDateString();
}