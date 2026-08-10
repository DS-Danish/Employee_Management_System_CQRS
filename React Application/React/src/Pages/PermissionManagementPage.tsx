import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiError,
} from "../services/apiClient";

import {
  getPermissionUsers,
  getPermissions,
  getUserPermissions,
  updateUserPermissions,
} from "../services/permissionService";

import type {
  StoredUser,
} from "../Types/auth";

import type {
  Permission,
  PermissionUser,
} from "../Types/permission";

const EMPLOYEE_RESTRICTED_PERMISSION_CODES: ReadonlySet<string> =
  new Set<string>([
    "employees.manage",
    "employees.delete",
  ]);

export default function PermissionManagementPage():
  React.ReactElement {
  const currentUser: StoredUser | null =
    getStoredUser();

  const [
    users,
    setUsers,
  ] = useState<PermissionUser[]>([]);

  const [
    permissions,
    setPermissions,
  ] = useState<Permission[]>([]);

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState<string>("");

  const [
    selectedPermissionIds,
    setSelectedPermissionIds,
  ] = useState<number[]>([]);

  const [
    originalPermissionIds,
    setOriginalPermissionIds,
  ] = useState<number[]>([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    loadingUserPermissions,
    setLoadingUserPermissions,
  ] = useState<boolean>(false);

  const [
    saving,
    setSaving,
  ] = useState<boolean>(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const isSuperAdmin: boolean =
    currentUser?.role ===
    "SuperAdmin";

  const isTeamLead: boolean =
    currentUser?.role ===
    "TeamLead";

  /*
   * Backend is authoritative, but we also
   * remove the logged-in account from the
   * frontend list.
   */
  const manageableUsers:
    PermissionUser[] =
    useMemo(
      () =>
        users.filter(
          (
            user:
              PermissionUser,
          ) =>
            user.id !==
            currentUser?.userId,
        ),
      [
        users,
        currentUser?.userId,
      ],
    );

  const selectedUser: PermissionUser | undefined =
    useMemo(
      () =>
        manageableUsers.find(
          (
            user: PermissionUser,
          ): boolean =>
            user.id === selectedUserId,
        ),
      [
        manageableUsers,
        selectedUserId,
      ],
    );

  const assignablePermissions: Permission[] =
    useMemo(
      () => {
        if (!selectedUser) {
          return [];
        }

        if (selectedUser.role === "Employee") {
          return permissions.filter(
            (
              permission: Permission,
            ): boolean =>
              !EMPLOYEE_RESTRICTED_PERMISSION_CODES.has(
                permission.code,
              ),
          );
        }

        return permissions;
      },
      [
        permissions,
        selectedUser,
      ],
    );

  useEffect(() => {
    async function loadData():
      Promise<void> {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          usersResult,
          permissionsResult,
        ] = await Promise.all([
          getPermissionUsers(),
          getPermissions(),
        ]);

        setUsers(
          usersResult,
        );

        setPermissions(
          permissionsResult,
        );
      } catch (error: unknown) {
        setErrorMessage(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleUserChange(
    userId: string,
  ): Promise<void> {
    setSelectedUserId(
      userId,
    );

    setSelectedPermissionIds(
      [],
    );

    setOriginalPermissionIds(
      [],
    );

    setSuccessMessage("");
    setErrorMessage("");

    if (!userId) {
      return;
    }

    /*
     * Additional frontend protection.
     * Backend must also enforce this.
     */
    if (
      userId ===
      currentUser?.userId
    ) {
      setSelectedUserId("");

      setErrorMessage(
        "You cannot manage your own permissions.",
      );

      return;
    }

    try {
      setLoadingUserPermissions(
        true,
      );

      const userPermissions =
        await getUserPermissions(
          userId,
        );

      const selectedPermissionUser:
        PermissionUser | undefined =
        manageableUsers.find(
          (
            user: PermissionUser,
          ): boolean =>
            user.id === userId,
        );

      const permissionIds: number[] =
        userPermissions
          .filter(
            (
              permission: Permission,
            ): boolean => {
              if (
                selectedPermissionUser?.role !==
                "Employee"
              ) {
                return true;
              }

              return !EMPLOYEE_RESTRICTED_PERMISSION_CODES
                .has(
                  permission.code,
                );
            },
          )
          .map(
            (
              permission: Permission,
            ): number =>
              permission.id,
          );

      setSelectedPermissionIds(
        permissionIds,
      );

      setOriginalPermissionIds(
        permissionIds,
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setLoadingUserPermissions(
        false,
      );
    }
  }

  function handlePermissionChange(
    permissionId: number,
    checked: boolean,
  ): void {
    setSelectedPermissionIds(
      (
        currentPermissionIds:
          number[],
      ) => {
        if (checked) {
          if (
            currentPermissionIds
              .includes(
                permissionId,
              )
          ) {
            return currentPermissionIds;
          }

          return [
            ...currentPermissionIds,
            permissionId,
          ];
        }

        return currentPermissionIds
          .filter(
            (
              currentPermissionId:
                number,
            ) =>
              currentPermissionId !==
              permissionId,
          );
      },
    );
  }

  const hasPermissionChanges: boolean =
    useMemo(
      () => {
        if (!selectedUserId) {
          return false;
        }

        if (
          selectedPermissionIds.length !==
          originalPermissionIds.length
        ) {
          return true;
        }

        return selectedPermissionIds.some(
          (
            permissionId: number,
          ): boolean =>
            !originalPermissionIds.includes(
              permissionId,
            ),
        );
      },
      [
        selectedUserId,
        selectedPermissionIds,
        originalPermissionIds,
      ],
    );

  async function handleSave():
    Promise<void> {
    if (!selectedUserId) {
      setErrorMessage(
        isTeamLead
          ? "Select an employee."
          : "Select an employee or team lead.",
      );

      return;
    }

    if (
      selectedUserId ===
      currentUser?.userId
    ) {
      setErrorMessage(
        "You cannot modify your own permissions.",
      );

      return;
    }

    if (!hasPermissionChanges) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const assignablePermissionIds:
        Set<number> =
        new Set<number>(
          assignablePermissions.map(
            (
              permission: Permission,
            ): number =>
              permission.id,
          ),
        );

      const permissionIdsToSave: number[] =
        selectedPermissionIds.filter(
          (
            permissionId: number,
          ): boolean =>
            assignablePermissionIds.has(
              permissionId,
            ),
        );

      await updateUserPermissions(
        selectedUserId,
        permissionIdsToSave,
      );

      setOriginalPermissionIds(
        [...permissionIdsToSave],
      );

      setSelectedPermissionIds(
        [...permissionIdsToSave],
      );

      setSuccessMessage(
        "Permissions updated successfully.",
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Employee should never reach this page
   * because App.tsx doesn't expose the route.
   *
   * Keep a defensive UI check as well.
   */
  if (
    !isSuperAdmin &&
    !isTeamLead
  ) {
    return (
      <Container
        maxWidth="md"
        sx={{
          py: 5,
        }}
      >
        <Alert severity="error">
          You do not have permission
          to manage user permissions.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const targetLabel: string =
    isTeamLead
      ? "Employee"
      : "Employee / Team Lead";

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
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
              }}
            >
              Permission Management
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              {isSuperAdmin
                ? "Assign application permissions to employees and team leads."
                : "Assign application permissions to employees."}
            </Typography>
          </Box>

          {errorMessage && (
            <Alert
              severity="error"
              onClose={() =>
                setErrorMessage("")
              }
            >
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert
              severity="success"
              onClose={() =>
                setSuccessMessage("")
              }
            >
              {successMessage}
            </Alert>
          )}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 3,
                  md: 4,
                },
              }}
            >
              <Stack spacing={4}>
                <FormControl fullWidth>
                  <InputLabel>
                    {targetLabel}
                  </InputLabel>

                  <Select
                    value={
                      selectedUserId
                    }
                    label={
                      targetLabel
                    }
                    onChange={
                      event =>
                        void handleUserChange(
                          String(
                            event.target
                              .value,
                          ),
                        )
                    }
                  >
                    {manageableUsers.map(
                      (
                        user:
                          PermissionUser,
                      ) => (
                        <MenuItem
                          key={
                            user.id
                          }
                          value={
                            user.id
                          }
                        >
                          {user.name}
                          {" — "}
                          {user.role}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>

                {manageableUsers.length === 0 && (
                  <Alert severity="info">
                    {isTeamLead
                      ? "There are no employees available for permission management."
                      : "There are no users available for permission management."}
                  </Alert>
                )}

                {selectedUserId && (
                  <>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                        }}
                      >
                        Permissions
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Select only the
                        capabilities this
                        user should have.
                      </Typography>
                    </Box>

                    {selectedUser?.role ===
                      "Employee" && (
                      <Alert severity="info">
                        Employees may be granted view access,
                        but employee edit and delete permissions
                        are restricted to Team Leads and
                        Super Admins.
                      </Alert>
                    )}

                    {loadingUserPermissions ? (
                      <Box
                        sx={{
                          py: 4,
                          display: "flex",
                          justifyContent:
                            "center",
                        }}
                      >
                        <CircularProgress
                          size={28}
                        />
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {assignablePermissions.map(
                          (
                            permission:
                              Permission,
                          ) => (
                            <FormControlLabel
                              key={
                                permission.id
                              }
                              control={
                                <Checkbox
                                  checked={
                                    selectedPermissionIds
                                      .includes(
                                        permission.id,
                                      )
                                  }
                                  onChange={
                                    event =>
                                      handlePermissionChange(
                                        permission.id,
                                        event.target
                                          .checked,
                                      )
                                  }
                                />
                              }
                              label={
                                <Box>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontWeight:
                                        500,
                                    }}
                                  >
                                    {
                                      permission.name
                                    }
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {
                                      permission.code
                                    }
                                  </Typography>
                                </Box>
                              }
                            />
                          ),
                        )}
                      </Stack>
                    )}

                    <Button
                      variant="contained"
                      disabled={
                        saving ||
                        loadingUserPermissions ||
                        !hasPermissionChanges
                      }
                      onClick={() =>
                        void handleSave()
                      }
                      sx={{
                        alignSelf:
                          "flex-start",
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : "Save Permissions"}
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
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
    return JSON.parse(
      storedUserJson,
    ) as StoredUser;
  } catch {
    return null;
  }
}

function getErrorMessage(
  error: unknown,
): string {
  console.error(
    "Permission error:",
    error,
  );

  if (
    error instanceof ApiError
  ) {
    return `${error.status}: ${error.message}`;
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Unable to process permission information.";
}