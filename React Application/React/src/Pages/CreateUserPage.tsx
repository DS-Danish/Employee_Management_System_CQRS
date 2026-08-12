import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { CreateUserModal } from "../Components/CreateUserModal";
import { getSystemUsers } from "../services/authService";
import type { SystemUser } from "../Types/auth";

export default function CreateUserPage():
  React.ReactElement {
  const [users, setUsers] =
    useState<SystemUser[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [
    createUserModalOpen,
    setCreateUserModalOpen,
  ] = useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const USERS_PER_BATCH = 10;

  const [
    visibleUserCount,
    setVisibleUserCount,
  ] = useState<number>(
    USERS_PER_BATCH,
  );

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const loadMoreTriggerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const displayedUsers:
    SystemUser[] =
    users.slice(
      0,
      visibleUserCount,
    );

  const hasMoreUsers: boolean =
    visibleUserCount <
    users.length;

  useEffect(() => {
    setVisibleUserCount(
      USERS_PER_BATCH,
    );
  }, [users]);

  useEffect(() => {
    const trigger:
      HTMLDivElement | null =
      loadMoreTriggerRef.current;

    if (!trigger || !hasMoreUsers) {
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

          if (entry?.isIntersecting) {
            setVisibleUserCount(
              (
                currentCount:
                  number,
              ): number =>
                Math.min(
                  currentCount +
                    USERS_PER_BATCH,
                  users.length,
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
    hasMoreUsers,
    users.length,
  ]);

  const loadUsers =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const result: SystemUser[] =
            await getSystemUsers();

          setUsers(result);
        } catch (caughtError: unknown) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load system users.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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
                    letterSpacing: 1.5,
                  }}
                >
                  User Management
                </Typography>

                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Users
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                  }}
                >
                  View all users in the
                  system and create user
                  accounts.
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={
                    <RefreshIcon />
                  }
                  disabled={loading}
                  onClick={() =>
                    void loadUsers()
                  }
                  sx={{
                    color:
                      "common.white",
                    borderColor:
                      "rgba(255,255,255,0.6)",
                    "&:hover": {
                      borderColor:
                        "common.white",
                      bgcolor:
                        "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Refresh
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  disableElevation
                  startIcon={
                    <ManageAccountsIcon />
                  }
                  onClick={() =>
                    setCreateUserModalOpen(
                      true,
                    )
                  }
                  sx={{
                    bgcolor:
                      "common.white",
                    color:
                      "primary.main",
                    "&:hover": {
                      bgcolor:
                        "rgba(255,255,255,0.92)",
                    },
                  }}
                >
                  Create User
                </Button>
              </Stack>
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

          <Paper
            elevation={0}
            sx={{
              border:
                "1px solid",
              borderColor:
                "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: {
                  xs: 2,
                  sm: 3,
                },
                py: 2.25,
                borderBottom:
                  "1px solid",
                borderColor:
                  "divider",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "#0F172A" }}
                >
                  All Users
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Registered accounts and
                  their assigned roles.
                </Typography>
              </Box>

              {loading ? (
                <CircularProgress
                  size={22}
                />
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    px: 1.5,
                    py: 0.65,
                    borderRadius: 999,
                    bgcolor: "#EEF2FF",
                    color: "#4F46E5",
                    fontWeight: 700,
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {users.length}{" "}
                  {users.length === 1
                    ? "user"
                    : "users"}
                </Typography>
              )}
            </Box>

            <TableContainer
              ref={scrollContainerRef}
              sx={{
                maxHeight: {
                  xs: "58vh",
                  md: "56vh",
                },
                overflowY: "auto",
                overscrollBehavior:
                  "contain",
                scrollbarGutter:
                  "stable",
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Sr. No
                    </TableCell>

                    <TableCell>
                      User
                    </TableCell>

                    <TableCell>
                      Email
                    </TableCell>

                    <TableCell>
                      Role
                    </TableCell>

                    <TableCell>
                      Department
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        <Typography
                          color="text.secondary"
                        >
                          No users found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedUsers.map(
                      (
                        user:
                          SystemUser,
                        index:
                          number,
                      ) => (
                        <TableRow
                          key={
                            user.userId
                          }
                          hover
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight:
                                  600,
                                color:
                                  "text.secondary",
                                fontVariantNumeric:
                                  "tabular-nums",
                                letterSpacing:
                                  0.4,
                              }}
                            >
                              {String(
                                index + 1,
                              ).padStart(
                                3,
                                "0",
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                user.fullName
                              }
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {
                              user.email
                            }
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                formatRole(
                                  user.role,
                                )
                              }
                              color={
                                getRoleColor(
                                  user.role,
                                )
                              }
                              variant="outlined"
                            />
                          </TableCell>

                          <TableCell>
                            {user.departmentName ??
                              (user.role ===
                              "SuperAdmin"
                                ? "System-wide"
                                : "Not assigned")}
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>

              <Box
                ref={loadMoreTriggerRef}
                sx={{ height: 1 }}
              />
            </TableContainer>
          </Paper>
        </Stack>
      </Container>

      <CreateUserModal
        open={createUserModalOpen}
        onClose={() =>
          setCreateUserModalOpen(
            false,
          )
        }
      />
    </Box>
  );
}

function formatRole(
  role: SystemUser["role"],
): string {
  switch (role) {
    case "SuperAdmin":
      return "Super Admin";

    case "TeamLead":
      return "Team Lead";

    case "Employee":
      return "Employee";
  }
}

function getRoleColor(
  role: SystemUser["role"],
):
  | "error"
  | "warning"
  | "primary" {
  switch (role) {
    case "SuperAdmin":
      return "error";

    case "TeamLead":
      return "warning";

    case "Employee":
      return "primary";
  }
}