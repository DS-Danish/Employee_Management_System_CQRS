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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
  alpha,
} from "@mui/material";

import ApartmentIcon from "@mui/icons-material/Apartment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SecurityIcon from "@mui/icons-material/Security";
import WorkIcon from "@mui/icons-material/Work";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "../services/apiClient";

import {
  getPermissionRoles,
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
} from "../services/permissionService";

import type { StoredUser } from "../Types/auth";

import type {
  Permission,
  PermissionRole,
} from "../Types/permission";

const ACCENT = "#4F46E5";

const EMPLOYEE_RESTRICTED_PERMISSION_CODES:
  ReadonlySet<string> =
    new Set<string>([
      "employees.manage",
      "employees.delete",
    ]);

const PERMISSION_CATEGORY_STYLES:
  Record<
    string,
    {
      color: string;
      icon: ReactNode;
    }
  > = {
    employees: {
      color: "#4F46E5",
      icon: <GroupsIcon fontSize="small" />,
    },

    departments: {
      color: "#0D9488",
      icon: <ApartmentIcon fontSize="small" />,
    },

    projects: {
      color: "#7C3AED",
      icon: <WorkIcon fontSize="small" />,
    },

    leaves: {
      color: "#D97706",
      icon: <EventAvailableIcon fontSize="small" />,
    },

    leave: {
      color: "#D97706",
      icon: <EventAvailableIcon fontSize="small" />,
    },

    users: {
      color: "#2563EB",
      icon: <ManageAccountsIcon fontSize="small" />,
    },

    permissions: {
      color: "#DC2626",
      icon: <SecurityIcon fontSize="small" />,
    },
  };

const DEFAULT_CATEGORY_STYLE: {
  color: string;
  icon: ReactNode;
} = {
  color: "#64748B",
  icon: <SecurityIcon fontSize="small" />,
};

function getPermissionCategoryStyle(
  code: string,
): {
  color: string;
  icon: ReactNode;
} {
  const prefix: string =
    code
      .split(".")[0]
      ?.toLowerCase() ?? "";

  return (
    PERMISSION_CATEGORY_STYLES[prefix] ??
    DEFAULT_CATEGORY_STYLE
  );
}

export default function PermissionManagementPage():
  React.ReactElement {
  const currentUser: StoredUser | null =
    getStoredUser();

  const [roles, setRoles] =
    useState<PermissionRole[]>([]);

  const [permissions, setPermissions] =
    useState<Permission[]>([]);

  const [selectedRole, setSelectedRole] =
    useState<string>("");

  const [
    selectedPermissionIds,
    setSelectedPermissionIds,
  ] = useState<number[]>([]);

  const [
    originalPermissionIds,
    setOriginalPermissionIds,
  ] = useState<number[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [
    loadingRolePermissions,
    setLoadingRolePermissions,
  ] = useState<boolean>(false);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const isSuperAdmin: boolean =
    currentUser?.role === "SuperAdmin";

  const isTeamLead: boolean =
    currentUser?.role === "TeamLead";

  const selectedRoleDetails:
    PermissionRole | undefined =
      useMemo(
        () =>
          roles.find(
            (
              role: PermissionRole,
            ): boolean =>
              role.name === selectedRole,
          ),
        [roles, selectedRole],
      );

  /*
   * Employee role must never receive
   * employee management/delete permissions.
   */
  const assignablePermissions:
    Permission[] =
      useMemo(() => {
        if (!selectedRole) {
          return [];
        }

        if (selectedRole === "Employee") {
          return permissions.filter(
            (
              permission: Permission,
            ): boolean =>
              !EMPLOYEE_RESTRICTED_PERMISSION_CODES
                .has(permission.code),
          );
        }

        return permissions;
      }, [permissions, selectedRole]);

  useEffect(() => {
    async function loadData():
      Promise<void> {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          rolesResult,
          permissionsResult,
        ] = await Promise.all([
          getPermissionRoles(),
          getPermissions(),
        ]);

        setRoles(rolesResult);
        setPermissions(permissionsResult);
      } catch (error: unknown) {
        setErrorMessage(
          getErrorMessage(error),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleRoleChange(
    roleName: string,
  ): Promise<void> {
    setSelectedRole(roleName);

    setSelectedPermissionIds([]);
    setOriginalPermissionIds([]);

    setSuccessMessage("");
    setErrorMessage("");

    if (!roleName) {
      return;
    }

    try {
      setLoadingRolePermissions(true);

      const rolePermissions:
        Permission[] =
          await getRolePermissions(
            roleName,
          );

      const permissionIds: number[] =
        rolePermissions
          .filter(
            (
              permission: Permission,
            ): boolean => {
              if (
                roleName !== "Employee"
              ) {
                return true;
              }

              return (
                !EMPLOYEE_RESTRICTED_PERMISSION_CODES
                  .has(permission.code)
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
        getErrorMessage(error),
      );
    } finally {
      setLoadingRolePermissions(false);
    }
  }

  function handlePermissionToggle(
    permissionId: number,
    checked: boolean,
  ): void {
    setSelectedPermissionIds(
      (
        currentPermissionIds:
          number[],
      ): number[] => {
        if (checked) {
          if (
            currentPermissionIds.includes(
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

        return currentPermissionIds.filter(
          (
            currentPermissionId:
              number,
          ): boolean =>
            currentPermissionId !==
            permissionId,
        );
      },
    );
  }

  const hasPermissionChanges:
    boolean =
      useMemo(() => {
        if (!selectedRole) {
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
      }, [
        selectedRole,
        selectedPermissionIds,
        originalPermissionIds,
      ]);

  function handleDiscardChanges():
    void {
    setSelectedPermissionIds([
      ...originalPermissionIds,
    ]);

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSave():
    Promise<void> {
    if (!selectedRole) {
      setErrorMessage(
        "Select a role first.",
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
                permission:
                  Permission,
              ): number =>
                permission.id,
            ),
          );

      const permissionIdsToSave:
        number[] =
          selectedPermissionIds.filter(
            (
              permissionId: number,
            ): boolean =>
              assignablePermissionIds
                .has(permissionId),
          );

      await updateRolePermissions(
        selectedRole,
        permissionIdsToSave,
      );

      setOriginalPermissionIds([
        ...permissionIdsToSave,
      ]);

      setSelectedPermissionIds([
        ...permissionIdsToSave,
      ]);

      setSuccessMessage(
        `${
          selectedRoleDetails
            ?.displayName ??
          selectedRole
        } permissions updated successfully.`,
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isSuperAdmin && !isTeamLead) {
    return (
      <Container
        maxWidth="md"
        sx={{ py: 5 }}
      >
        <Alert severity="error">
          You do not have permission to
          manage role permissions.
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
        <Stack spacing={3}>
          {/* HEADER */}
          <Stack
            direction="row"
            spacing={1.75}
            sx={{
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(
                  ACCENT,
                  0.12,
                ),
                color: ACCENT,
                flexShrink: 0,
              }}
            >
              <SecurityIcon />
            </Box>

            <Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: "#0F172A",
                }}
              >
                Permission Management
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Manage application access
                for employees and team
                leads by role.
              </Typography>
            </Box>
          </Stack>

          {errorMessage && (
            <Alert
              severity="error"
              onClose={() =>
                setErrorMessage("")
              }
              sx={{ borderRadius: 2 }}
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
              sx={{ borderRadius: 2 }}
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
                {/* ROLE SELECTION */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    Select Role
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Permissions saved here
                    apply to every user
                    assigned to the selected
                    role.
                  </Typography>

                  <FormControl
                    fullWidth
                    sx={{
                      maxWidth: 520,
                    }}
                  >
                    <InputLabel>
                      Role
                    </InputLabel>

                    <Select
                      value={selectedRole}
                      label="Role"
                      onChange={(
                        event,
                      ) =>
                        void handleRoleChange(
                          String(
                            event.target
                              .value,
                          ),
                        )
                      }
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {roles.map(
                        (
                          role:
                            PermissionRole,
                        ) => (
                          <MenuItem
                            key={
                              role.name
                            }
                            value={
                              role.name
                            }
                          >
                            {
                              role.displayName
                            }
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                </Box>

                {roles.length === 0 && (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    There are no roles
                    available for permission
                    management.
                  </Alert>
                )}

                {selectedRole && (
                  <>
                    <Box
                      sx={{
                        height: "1px",
                        bgcolor: "divider",
                      }}
                    />

                    <Stack
                      direction="row"
                      sx={{
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 0.5,
                          }}
                        >
                          Permissions for{" "}
                          {selectedRoleDetails
                            ?.displayName ??
                            selectedRole}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Enable the
                          capabilities that
                          every user in this
                          role should have.
                        </Typography>
                      </Box>

                      {!loadingRolePermissions &&
                        assignablePermissions
                          .length > 0 && (
                          <Chip
                            label={`${selectedPermissionIds.length} of ${assignablePermissions.length} enabled`}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor:
                                alpha(
                                  ACCENT,
                                  0.1,
                                ),
                              color:
                                ACCENT,
                            }}
                          />
                        )}
                    </Stack>

                    {selectedRole ===
                      "Employee" && (
                      <Alert
                        severity="info"
                        sx={{
                          borderRadius: 2,
                        }}
                      >
                        Employee edit and
                        delete permissions
                        are restricted and
                        cannot be assigned
                        to the Employee
                        role.
                      </Alert>
                    )}

                    {loadingRolePermissions ? (
                      <Box
                        sx={{
                          py: 5,
                          display:
                            "flex",
                          justifyContent:
                            "center",
                        }}
                      >
                        <CircularProgress
                          size={28}
                        />
                      </Box>
                    ) : (
                      <Stack
                        spacing={1.25}
                      >
                        {assignablePermissions
                          .map(
                            (
                              permission:
                                Permission,
                            ) => (
                              <PermissionRow
                                key={
                                  permission.id
                                }
                                permission={
                                  permission
                                }
                                checked={selectedPermissionIds.includes(
                                  permission.id,
                                )}
                                onToggle={(
                                  checked:
                                    boolean,
                                ) =>
                                  handlePermissionToggle(
                                    permission.id,
                                    checked,
                                  )
                                }
                              />
                            ),
                          )}
                      </Stack>
                    )}

                    {!loadingRolePermissions &&
                      assignablePermissions
                        .length === 0 && (
                        <Alert
                          severity="info"
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          No permissions
                          are available for
                          this role.
                        </Alert>
                      )}

                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        alignItems:
                          "center",
                        pt: 1,
                      }}
                    >
                      <Button
                        type="button"
                        variant="contained"
                        disableElevation
                        disabled={
                          saving ||
                          loadingRolePermissions ||
                          !hasPermissionChanges
                        }
                        onClick={() =>
                          void handleSave()
                        }
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          fontWeight: 700,
                          textTransform:
                            "none",
                        }}
                      >
                        {saving
                          ? "Saving..."
                          : "Save Permissions"}
                      </Button>

                      {hasPermissionChanges &&
                        !saving && (
                          <Button
                            type="button"
                            variant="text"
                            onClick={
                              handleDiscardChanges
                            }
                            sx={{
                              borderRadius: 2,
                              color:
                                "text.secondary",
                              textTransform:
                                "none",
                            }}
                          >
                            Discard changes
                          </Button>
                        )}
                    </Stack>
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

interface PermissionRowProps {
  permission: Permission;
  checked: boolean;
  onToggle: (
    checked: boolean,
  ) => void;
}

function PermissionRow({
  permission,
  checked,
  onToggle,
}: PermissionRowProps):
  React.ReactElement {
  const {
    color,
    icon,
  } = getPermissionCategoryStyle(
    permission.code,
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: 2,

        borderColor: checked
          ? alpha(color, 0.35)
          : "divider",

        bgcolor: checked
          ? alpha(color, 0.04)
          : "background.paper",

        transition:
          "border-color 150ms ease, background-color 150ms ease",
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            bgcolor: alpha(
              color,
              0.12,
            ),
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
            }}
            noWrap
          >
            {permission.name}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {permission.code}
          </Typography>
        </Box>
      </Stack>

      <Switch
        checked={checked}
        onChange={(event) =>
          onToggle(
            event.target.checked,
          )
        }
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked":
            {
              color,
            },

          "& .MuiSwitch-switchBase.Mui-checked:hover":
            {
              bgcolor: alpha(
                color,
                0.08,
              ),
            },

          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
            {
              bgcolor: color,
              opacity: 1,
            },
        }}
      />
    </Paper>
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

function getErrorMessage(
  error: unknown,
): string {
  console.error(
    "Permission error:",
    error,
  );

  if (error instanceof ApiError) {
    return `${error.status}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process permission information.";
}