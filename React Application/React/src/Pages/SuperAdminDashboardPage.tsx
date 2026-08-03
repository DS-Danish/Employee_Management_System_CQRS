import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import ApartmentIcon from "@mui/icons-material/Apartment";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GroupsIcon from "@mui/icons-material/Groups";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import RefreshIcon from "@mui/icons-material/Refresh";
import WorkIcon from "@mui/icons-material/Work";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  getDepartments,
} from "../services/departmentService";

import {
  getEmployees,
} from "../services/employeeService";

import {
  getProjects,
} from "../services/projectService";

import type {
  StoredUser,
} from "../Types/auth";

interface DashboardStatistics {
  employees: number;
  departments: number;
  projects: number;
}

interface SummaryCardProps {
  title: string;
  value: number;
  loading: boolean;
  icon: ReactNode;
}

interface ManagementCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  path: string;
  icon: ReactNode;
}

export default function SuperAdminDashboardPage():
  React.ReactElement {

  const currentUser: StoredUser | null =
    getStoredUser();

  const [
    statistics,
    setStatistics,
  ] = useState<DashboardStatistics>({
    employees: 0,
    departments: 0,
    projects: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    error,
    setError,
  ] = useState<string>("");

  const loadDashboard =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const [
            employees,
            departments,
            projects,
          ] = await Promise.all([
            getEmployees(),
            getDepartments(),
            getProjects(),
          ]);

          setStatistics({
            employees:
              employees.length,
            departments:
              departments.length,
            projects:
              projects.length,
          });
        } catch (
          caughtError: unknown
        ) {
          const message: string =
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load dashboard information.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

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
        <Stack spacing={4}>
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
                    opacity: 0.8,
                    letterSpacing: 1.5,
                  }}
                >
                  Employee Management
                  System
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mt: 0.5,
                  }}
                >
                  Super Admin Dashboard
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                    maxWidth: 700,
                  }}
                >
                  Welcome back,{" "}
                  {currentUser?.fullName ??
                    "Super Admin"}
                  . Manage employees,
                  departments, projects
                  and user access from
                  one place.
                </Typography>
              </Box>

              <Tooltip title="Refresh dashboard">
                <span>
                  <IconButton
                    disabled={loading}
                    onClick={() =>
                      void loadDashboard()
                    }
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

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
              }}
            >
              Overview
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Current system
              information.
            </Typography>
          </Box>

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
              }}
            >
              <SummaryCard
                title="Employees"
                value={
                  statistics.employees
                }
                loading={loading}
                icon={<GroupsIcon />}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
              }}
            >
              <SummaryCard
                title="Departments"
                value={
                  statistics.departments
                }
                loading={loading}
                icon={<ApartmentIcon />}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
              }}
            >
              <SummaryCard
                title="Projects"
                value={
                  statistics.projects
                }
                loading={loading}
                icon={<WorkIcon />}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
              }}
            >
              Administration
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Access administrative
              features of the system.
            </Typography>
          </Box>

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <ManagementCard
                title="Employees"
                description="Create, view, update and delete employee records."
                buttonLabel="Manage employees"
                path="/super-admin/employees"
                icon={<GroupsIcon />}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <ManagementCard
                title="Departments"
                description="Create and maintain departments across the organisation."
                buttonLabel="Manage departments"
                path="/super-admin/departments"
                icon={
                  <ApartmentIcon />
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <ManagementCard
                title="Projects"
                description="Manage projects and employee project assignments."
                buttonLabel="Manage projects"
                path="/super-admin/projects"
                icon={<WorkIcon />}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
            >
              <ManagementCard
                title="User Access"
                description="Create user accounts and assign application roles."
                buttonLabel="Create user"
                path="/super-admin/users/create"
                icon={
                  <ManageAccountsIcon />
                }
              />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2.5,
              }}
            >
              Account Information
            </Typography>

            <Grid
              container
              spacing={3}
            >
              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Full name
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {currentUser?.fullName ??
                    "Not available"}
                </Typography>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Email
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 600,
                    wordBreak:
                      "break-word",
                  }}
                >
                  {currentUser?.email ??
                    "Not available"}
                </Typography>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Role
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {currentUser?.role ??
                    "SuperAdmin"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  icon,
}: SummaryCardProps): React.ReactElement {
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
      <CardContent
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 52,
            height: 52,
            bgcolor:
              "primary.main",
          }}
        >
          {icon}
        </Avatar>

        <Box>
          {loading ? (
            <Skeleton
              width={60}
              height={38}
            />
          ) : (
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
              }}
            >
              {value}
            </Typography>
          )}

          <Typography
            color="text.secondary"
          >
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ManagementCard({
  title,
  description,
  buttonLabel,
  path,
  icon,
}: ManagementCardProps): React.ReactElement {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        boxShadow: "none",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",

        "&:hover": {
          transform:
            "translateY(-3px)",
          boxShadow: 3,
        },
      }}
    >
      <CardActionArea
        onClick={() =>
          navigate(path)
        }
        sx={{
          height: "100%",
        }}
      >
        <CardContent
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection:
              "column",
          }}
        >
          <Avatar
            sx={{
              bgcolor:
                "primary.main",
              mb: 2,
            }}
          >
            {icon}
          </Avatar>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              mb: 3,
              flexGrow: 1,
            }}
          >
            {description}
          </Typography>

          <Button
            type="button"
            endIcon={
              <ArrowForwardIcon />
            }
            sx={{
              alignSelf:
                "flex-start",
              px: 0,
            }}
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function getStoredUser():
  StoredUser | null {
  const storedUserJson:
    | string
    | null =
    localStorage.getItem(
      "authUser",
    );

  if (!storedUserJson) {
    return null;
  }

  try {
    const user =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;

    if (
      user.role !==
      "SuperAdmin"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}