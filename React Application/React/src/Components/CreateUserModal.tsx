import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ManageAccountsIcon from
  "@mui/icons-material/ManageAccounts";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
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

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
}

export function CreateUserModal({
  open,
  onClose,
  onCreated,
}: CreateUserModalProps): React.ReactElement {
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
    if (open) {
      void loadFormData();
    }
  }, [loadFormData, open]);

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

      await onCreated?.();
      onClose();
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

  function handleDialogClose(): void {
    if (saving) {
      return;
    }

    setError("");
    setPassword("");
    setDepartmentId("");
    setEmployeeId("");
    setFullName("");
    setEmail("");
    setRole("Employee");
    onClose();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create User
        </DialogTitle>

        <DialogContent dividers>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create an application account and assign its access role.
          </Typography>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

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
                id="create-user-form"
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
                </Stack>
              </Box>
            )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            type="button"
            onClick={handleDialogClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="create-user-form"
            variant="contained"
            disableElevation
            disabled={saving || loading}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ManageAccountsIcon />
              )
            }
            sx={{ borderRadius: 2, px: 3 }}
          >
            {saving ? "Creating..." : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={(_event, reason) => {
          if (reason === "clickaway") {
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
          onClose={() => setSuccessMessage("")}
          sx={{
            width: "100%",
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}