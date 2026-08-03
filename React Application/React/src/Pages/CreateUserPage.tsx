import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ManageAccountsIcon from
  "@mui/icons-material/ManageAccounts";
import RefreshIcon from
  "@mui/icons-material/Refresh";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  getAvailableEmployees,
  registerUser,
} from "../services/authService";

import {
  getDepartments,
} from "../services/departmentService";

import type {
  AvailableEmployee,
  RegisterRequest,
  UserRole,
} from "../Types/auth";

import type {
  Department,
} from "../Types/department";

export default function CreateUserPage():
  React.ReactElement {
  const [
    fullName,
    setFullName,
  ] = useState<string>("");

  const [
    email,
    setEmail,
  ] = useState<string>("");

  const [
    password,
    setPassword,
  ] = useState<string>("");

  const [
    role,
    setRole,
  ] = useState<UserRole>(
    "Employee",
  );

  const [
    departmentId,
    setDepartmentId,
  ] = useState<string>("");

  const [
    employeeId,
    setEmployeeId,
  ] = useState<string>("");

  const [
    departments,
    setDepartments,
  ] = useState<Department[]>([]);

  const [
    availableEmployees,
    setAvailableEmployees,
  ] = useState<
    AvailableEmployee[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    saving,
    setSaving,
  ] = useState<boolean>(false);

  const [
    error,
    setError,
  ] = useState<string>("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string>("");

  const requiresEmployee: boolean =
    role === "Employee" ||
    role === "TeamLead";

  const loadFormData =
    useCallback(
      async (): Promise<void> => {
        setLoading(true);
        setError("");

        try {
          const [
            departmentResult,
            employeeResult,
          ] = await Promise.all([
            getDepartments(),
            getAvailableEmployees(),
          ]);

          setDepartments(
            departmentResult,
          );

          setAvailableEmployees(
            employeeResult,
          );
        } catch (
          caughtError: unknown
        ) {
          const message: string =
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load user form data.";

          setError(message);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadFormData();
  }, [loadFormData]);

  const employeesForSelectedDepartment:
    AvailableEmployee[] =
    useMemo(
      (): AvailableEmployee[] => {
        if (!departmentId) {
          return [];
        }

        return availableEmployees.filter(
          (
            employee:
              AvailableEmployee,
          ): boolean =>
            employee.departmentId ===
            departmentId,
        );
      },
      [
        availableEmployees,
        departmentId,
      ],
    );

  function clearEmployeeSelection():
    void {
    setEmployeeId("");
    setFullName("");
    setEmail("");
  }

  function handleRoleChange(
    selectedRole: UserRole,
  ): void {
    setRole(selectedRole);
    setError("");

    setDepartmentId("");
    setEmployeeId("");
    setFullName("");
    setEmail("");

    if (
      selectedRole ===
      "SuperAdmin"
    ) {
      setDepartmentId("");
      setEmployeeId("");
    }
  }

  function handleDepartmentChange(
    selectedDepartmentId: string,
  ): void {
    setDepartmentId(
      selectedDepartmentId,
    );

    clearEmployeeSelection();
  }

  function handleEmployeeChange(
    selectedEmployeeId: string,
  ): void {
    setEmployeeId(
      selectedEmployeeId,
    );

    const selectedEmployee:
      AvailableEmployee | undefined =
      availableEmployees.find(
        (
          employee:
            AvailableEmployee,
        ): boolean =>
          employee.id ===
          selectedEmployeeId,
      );

    if (!selectedEmployee) {
      setFullName("");
      setEmail("");

      return;
    }

    setFullName(
      selectedEmployee.fullName,
    );

    setEmail(
      selectedEmployee.email,
    );

    if (
      selectedEmployee.departmentId
    ) {
      setDepartmentId(
        selectedEmployee.departmentId,
      );
    }
  }

  function validateForm():
    string | null {
    if (!fullName.trim()) {
      return "Full name is required.";
    }

    if (!email.trim()) {
      return "Email is required.";
    }

    if (!password) {
      return "Password is required.";
    }

    if (
      password.length < 6
    ) {
      return (
        "Password must contain at " +
        "least 6 characters."
      );
    }

    if (
      requiresEmployee &&
      !departmentId
    ) {
      return (
        "Department is required " +
        "for Employee and Team Lead accounts."
      );
    }

    if (
      requiresEmployee &&
      !employeeId
    ) {
      return (
        "Select an employee who " +
        "does not already have a user account."
      );
    }

    return null;
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");

    const validationError:
      string | null =
      validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }

    const request:
      RegisterRequest = {
      fullName:
        fullName.trim(),

      email:
        email
          .trim()
          .toLowerCase(),

      password,

      role,

      departmentId:
        requiresEmployee
          ? departmentId
          : null,

      employeeId:
        requiresEmployee
          ? employeeId
          : null,
    };

    setSaving(true);

    try {
      await registerUser(
        request,
      );

      setSuccessMessage(
        `${fullName.trim()} was created successfully.`,
      );

      setPassword("");
      setDepartmentId("");
      setEmployeeId("");
      setFullName("");
      setEmail("");
      setRole("Employee");

      const refreshedEmployees:
        AvailableEmployee[] =
        await getAvailableEmployees();

      setAvailableEmployees(
        refreshedEmployees,
      );
    } catch (
      caughtError: unknown
    ) {
      const message: string =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create user.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        bgcolor: "#FAFAFA",
        minHeight: "100%",
      }}
    >
      <Container
        maxWidth="md"
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
                xs: 2.5,
                sm: 3.5,
              },
              borderRadius: 3,
              border:
                "1px solid",
              borderColor:
                "divider",
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
                justifyContent:
                  "space-between",
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                gap: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems:
                    "center",
                }}
              >
                <Avatar
                  sx={{
                    width: 54,
                    height: 54,
                    bgcolor:
                      "primary.main",
                  }}
                >
                  <ManageAccountsIcon />
                </Avatar>

                <Box>
                  <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Create User
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    Create an application
                    account and assign its
                    access role.
                  </Typography>
                </Box>
              </Stack>

              <Tooltip title="Refresh available employees">
                <span>
                  <IconButton
                    type="button"
                    disabled={
                      loading ||
                      saving
                    }
                    onClick={() =>
                      void loadFormData()
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

          <Paper
            variant="outlined"
            sx={{
              p: {
                xs: 2.5,
                sm: 4,
              },
              borderRadius: 3,
            }}
          >
            {loading ? (
              <Box
                sx={{
                  py: 8,
                  display: "flex",
                  justifyContent:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={(
                  event:
                    React.FormEvent<HTMLFormElement>,
                ) =>
                  void handleSubmit(
                    event,
                  )
                }
              >
                <Stack spacing={3}>
                  <FormControl
                    fullWidth
                  >
                    <InputLabel>
                      Role
                    </InputLabel>

                    <Select
                      label="Role"
                      value={role}
                      disabled={saving}
                      onChange={(
                        event,
                      ) =>
                        handleRoleChange(
                          event.target
                            .value as UserRole,
                        )
                      }
                    >
                      <MenuItem value="Employee">
                        Employee
                      </MenuItem>

                      <MenuItem value="TeamLead">
                        Team Lead
                      </MenuItem>

                      <MenuItem value="SuperAdmin">
                        Super Admin
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {requiresEmployee && (
                    <>
                      <FormControl
                        fullWidth
                      >
                        <InputLabel>
                          Department
                        </InputLabel>

                        <Select
                          label="Department"
                          value={
                            departmentId
                          }
                          disabled={saving}
                          onChange={(
                            event,
                          ) =>
                            handleDepartmentChange(
                              event.target
                                .value,
                            )
                          }
                        >
                          {departments.map(
                            (
                              department:
                                Department,
                            ) => (
                              <MenuItem
                                key={
                                  department.id
                                }
                                value={
                                  department.id
                                }
                              >
                                {
                                  department.name
                                }
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>

                      <FormControl
                        fullWidth
                        disabled={
                          saving ||
                          !departmentId
                        }
                      >
                        <InputLabel>
                          Employee
                        </InputLabel>

                        <Select
                          label="Employee"
                          value={
                            employeeId
                          }
                          onChange={(
                            event,
                          ) =>
                            handleEmployeeChange(
                              event.target
                                .value,
                            )
                          }
                        >
                          {employeesForSelectedDepartment.map(
                            (
                              employee:
                                AvailableEmployee,
                            ) => (
                              <MenuItem
                                key={
                                  employee.id
                                }
                                value={
                                  employee.id
                                }
                              >
                                {employee.fullName}
                                {" — "}
                                {employee.email}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>

                      {departmentId &&
                        employeesForSelectedDepartment
                          .length ===
                          0 && (
                          <Alert
                            severity="info"
                            sx={{
                              borderRadius:
                                2,
                            }}
                          >
                            All employees
                            in this
                            department
                            already have
                            user accounts,
                            or no employees
                            are assigned to
                            it.
                          </Alert>
                        )}
                    </>
                  )}

                  <TextField
                    required
                    fullWidth
                    label="Full name"
                    value={fullName}
                    disabled={
                      saving ||
                      requiresEmployee
                    }
                    helperText={
                      requiresEmployee
                        ? "Filled automatically from the selected employee."
                        : undefined
                    }
                    onChange={(
                      event:
                        React.ChangeEvent<HTMLInputElement>,
                    ) =>
                      setFullName(
                        event.target
                          .value,
                      )
                    }
                  />

                  <TextField
                    required
                    fullWidth
                    type="email"
                    label="Email"
                    value={email}
                    disabled={
                      saving ||
                      requiresEmployee
                    }
                    helperText={
                      requiresEmployee
                        ? "Filled automatically from the selected employee."
                        : undefined
                    }
                    onChange={(
                      event:
                        React.ChangeEvent<HTMLInputElement>,
                    ) =>
                      setEmail(
                        event.target
                          .value,
                      )
                    }
                  />

                  <TextField
                    required
                    fullWidth
                    type="password"
                    label="Temporary password"
                    value={password}
                    disabled={saving}
                    helperText="Use at least 6 characters and follow the configured password policy."
                    onChange={(
                      event:
                        React.ChangeEvent<HTMLInputElement>,
                    ) =>
                      setPassword(
                        event.target
                          .value,
                      )
                    }
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disableElevation
                    disabled={saving}
                    startIcon={
                      saving ? (
                        <CircularProgress
                          size={18}
                          color="inherit"
                        />
                      ) : (
                        <ManageAccountsIcon />
                      )
                    }
                    sx={{
                      alignSelf:
                        "flex-start",
                      px: 4,
                      borderRadius: 2,
                    }}
                  >
                    {saving
                      ? "Creating..."
                      : "Create user"}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>

      <Snackbar
        open={Boolean(
          successMessage,
        )}
        autoHideDuration={4000}
        onClose={(
          _event,
          reason,
        ) => {
          if (
            reason ===
            "clickaway"
          ) {
            return;
          }

          setSuccessMessage("");
        }}
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
            width: "100%",
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}