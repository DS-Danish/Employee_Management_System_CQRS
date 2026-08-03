import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  registerUser,
} from "../services/authService";

import {
  getDepartments,
} from "../services/departmentService";

import {
  getEmployees,
} from "../services/employeeService";

import type {
  Department,
} from "../Types/department";

import type {
  Employee,
} from "../Types/employee";

import type {
  UserRole,
} from "../Types/auth";

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
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

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

  useEffect(() => {
    async function loadData():
      Promise<void> {
      try {
        const [
          departmentResult,
          employeeResult,
        ] = await Promise.all([
          getDepartments(),
          getEmployees(),
        ]);

        setDepartments(
          departmentResult,
        );

        setEmployees(
          employeeResult,
        );
      } catch (
        caughtError: unknown
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load form data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const availableEmployees:
    Employee[] = useMemo(
    () =>
      employees.filter(
        (
          employee: Employee,
        ): boolean =>
          !departmentId ||
          employee.departmentId ===
            departmentId,
      ),
    [
      employees,
      departmentId,
    ],
  );

  function handleRoleChange(
    selectedRole: UserRole,
  ): void {
    setRole(selectedRole);

    if (
      selectedRole ===
      "SuperAdmin"
    ) {
      setDepartmentId("");
      setEmployeeId("");
    }
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError(
        "Full name, email and password are required.",
      );

      return;
    }

    if (
      role !== "SuperAdmin" &&
      !departmentId
    ) {
      setError(
        "Department is required.",
      );

      return;
    }

    if (
      (role === "Employee" ||
        role === "TeamLead") &&
      !employeeId
    ) {
      setError(
        "Employee is required.",
      );

      return;
    }

    setSaving(true);

    try {
      await registerUser({
        fullName:
          fullName.trim(),
        email:
          email
            .trim()
            .toLowerCase(),
        password,
        role,
        departmentId:
          role === "SuperAdmin"
            ? null
            : departmentId,
        employeeId:
          role === "SuperAdmin"
            ? null
            : employeeId,
      });

      setSuccessMessage(
        "User account created successfully.",
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Employee");
      setDepartmentId("");
      setEmployeeId("");
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create user.",
      );
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
              border:
                "1px solid",
              borderColor:
                "divider",
            }}
          >
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    alignItems: "center",
                }}
            >
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor:
                    "primary.main",
                }}
              >
                <ManageAccountsIcon />
              </Avatar>

              <Box>
                <Typography
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
                  py: 6,
                  textAlign:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={(
                  event,
                ) =>
                  void handleSubmit(
                    event,
                  )
                }
              >
                <Stack spacing={3}>
                  <TextField
                    required
                    fullWidth
                    label="Full name"
                    value={fullName}
                    onChange={(
                      event,
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
                    onChange={(
                      event,
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
                    label="Password"
                    value={password}
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event.target
                          .value,
                      )
                    }
                  />

                  <FormControl
                    fullWidth
                  >
                    <InputLabel>
                      Role
                    </InputLabel>

                    <Select
                      label="Role"
                      value={role}
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

                  {role !==
                    "SuperAdmin" && (
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
                        onChange={(
                          event,
                        ) => {
                          setDepartmentId(
                            event.target
                              .value,
                          );

                          setEmployeeId(
                            "",
                          );
                        }}
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
                  )}

                  {role !==
                    "SuperAdmin" && (
                    <FormControl
                      fullWidth
                      disabled={
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
                          setEmployeeId(
                            event.target
                              .value,
                          )
                        }
                      >
                        {availableEmployees.map(
                          (
                            employee:
                              Employee,
                          ) => (
                            <MenuItem
                              key={
                                employee.id
                              }
                              value={
                                employee.id
                              }
                            >
                              {employee.fullName ||
                                employee.email}
                            </MenuItem>
                          ),
                        )}
                      </Select>
                    </FormControl>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    sx={{
                      alignSelf:
                        "flex-start",
                      px: 4,
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
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}