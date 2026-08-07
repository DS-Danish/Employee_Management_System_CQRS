import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import type {
  StoredUser,
} from "../Types/auth";

interface OverviewCardProps {
  title: string;
  value: string;
  description: string;
}

export default function TeamLeadDashboardPage():
React.ReactElement {
  const navigate =
    useNavigate();

  const currentUser =
    getStoredUser();

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
      }}
    >
      {/* =========================
          HEADER
          ========================= */}

      <Card
        sx={{
          mb: 4,
          borderRadius: 3,

          background:
            "linear-gradient(135deg, #1976d2 0%, #512da8 100%)",

          color:
            "common.white",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              md: 4,
            },

            "&:last-child": {
              pb: {
                xs: 3,
                md: 4,
              },
            },
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
              Employee Management System
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              Team Lead Dashboard
            </Typography>

            <Typography
              sx={{
                mt: 1,
                opacity: 0.9,
              }}
            >
              Welcome back,{" "}
              {currentUser?.fullName ??
                "Team Lead"}.
              Manage your team,
              leave requests and account
              information.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* =========================
          MANAGEMENT
          ========================= */}

      <Box
        sx={{
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
          }}
        >
          Management
        </Typography>

        <Typography
          color="text.secondary"
        >
          Manage employees and leave
          activities assigned to your
          account.
        </Typography>
      </Box>

      <Grid
        container
        spacing={3}
      >
        {/* EMPLOYEE MANAGEMENT */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Employee Management
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  mb: 3,
                }}
              >
                View employee records,
                update employee information
                and manage employees assigned
                to your team.
              </Typography>

              <Button
                variant="contained"
                onClick={() => {
                  navigate(
                    "/team-lead/employees",
                  );
                }}
              >
                Manage employees
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* MY LEAVES */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                My Leaves
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  mb: 3,
                }}
              >
                View your annual leave
                balance, submit leave
                applications and track
                their status.
              </Typography>

              <Button
                variant="contained"
                onClick={() => {
                  navigate(
                    "/team-lead/leaves",
                  );
                }}
              >
                Manage my leaves
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* EMPLOYEE LEAVE REQUESTS */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Leave Requests
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  mb: 3,
                }}
              >
                Review pending leave
                applications submitted by
                employees assigned to your
                team.
              </Typography>

              <Button
                variant="contained"
                onClick={() => {
                  navigate(
                    "/team-lead/leave-requests",
                  );
                }}
              >
                Review requests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ACCOUNT INFORMATION */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Account Information
              </Typography>

              <Stack spacing={2}>
                <Box>
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
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Email address
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
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Assigned role
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {currentUser?.role ??
                      "TeamLead"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                sx={{
                  mt: 3,
                }}
                variant="outlined"
                onClick={() => {
                  navigate(
                    "/team-lead/profile",
                  );
                }}
              >
                View profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =========================
          OVERVIEW
          ========================= */}

      <Box
        sx={{
          mt: 5,
          mb: 3,
        }}
      >
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
        >
          Your current account and
          access information.
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
            md: 4,
          }}
        >
          <OverviewCard
            title="Account Status"
            value="Active"
            description="Your team lead account is currently active."
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <OverviewCard
            title="Access Level"
            value={
              currentUser?.role ??
              "TeamLead"
            }
            description="Your permissions are controlled by your assigned role."
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <OverviewCard
            title="Employee Access"
            value="Team Members"
            description="You can manage employees and review leave requests assigned to your team."
          />
        </Grid>
      </Grid>
    </Container>
  );
}

function OverviewCard({
  title,
  value,
  description,
}: OverviewCardProps):
React.ReactElement {
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
      <CardContent
        sx={{
          p: 3,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {title}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mt: 1,
            fontWeight: 700,
          }}
        >
          {value}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getStoredUser():
StoredUser | null {
  const storedUserJson =
    localStorage.getItem(
      "authUser",
    );

  if (!storedUserJson) {
    return null;
  }

  try {
    const storedUser =
      JSON.parse(
        storedUserJson,
      ) as StoredUser;

    if (
      storedUser.role !==
      "TeamLead"
    ) {
      return null;
    }

    return storedUser;
  } catch {
    return null;
  }
}