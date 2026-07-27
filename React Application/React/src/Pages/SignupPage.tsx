import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

type UserRole =
  | "SuperAdmin"
  | "DepartmentAdmin"
  | "Employee";

interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId: string | null;
  employeeId: string | null;
}

interface RegisterResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string | null;
  employeeId: string | null;
}

interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5000";

export default function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [role, setRole] =
    useState<UserRole>("Employee");

  const [
    departmentId,
    setDepartmentId,
  ] = useState("");

  const [
    employeeId,
    setEmployeeId,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedFullName =
      fullName.trim();

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedDepartmentId =
      departmentId.trim();

    const normalizedEmployeeId =
      employeeId.trim();

    if (!normalizedFullName) {
      setError("Full name is required.");
      return;
    }

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 5) {
      setError(
        "Password must contain at least 5 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Password and confirm password do not match.",
      );
      return;
    }

    if (
      role !== "SuperAdmin" &&
      !normalizedDepartmentId
    ) {
      setError(
        "Department ID is required for this role.",
      );
      return;
    }

    if (
      role === "Employee" &&
      !normalizedEmployeeId
    ) {
      setError(
        "Employee ID is required for an employee account.",
      );
      return;
    }

    const request: RegisterRequest = {
      fullName: normalizedFullName,
      email: normalizedEmail,
      password,
      role,
      departmentId:
        role === "SuperAdmin"
          ? null
          : normalizedDepartmentId,
      employeeId:
        role === "Employee"
          ? normalizedEmployeeId
          : null,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      const responseBody =
        await readResponseBody(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            responseBody,
            "Account creation failed.",
          ),
        );
      }

      const registerResponse =
        responseBody as RegisterResponse;

      setSuccess(
        `Account created successfully for ${registerResponse.fullName}. Redirecting to login...`,
      );

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);
    } catch (caughtError: unknown) {
      if (caughtError instanceof TypeError) {
        setError(
          `Could not connect to the API at ${API_BASE_URL}. ` +
            "Make sure the backend is running and VITE_API_BASE_URL is correct.",
        );

        return;
      }

      if (caughtError instanceof Error) {
        setError(caughtError.message);
        return;
      }

      setError(
        "An unexpected error occurred while creating the account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (
    selectedRole: UserRole,
  ) => {
    setRole(selectedRole);

    if (
      selectedRole === "SuperAdmin"
    ) {
      setDepartmentId("");
      setEmployeeId("");
      return;
    }

    if (
      selectedRole ===
      "DepartmentAdmin"
    ) {
      setEmployeeId("");
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: "100%",
            p: {
              xs: 3,
              sm: 5,
            },
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
            }}
          >
            Create account
          </Typography>

          <Typography
            align="center"
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            Register a new Employee Management account
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
              }}
            >
              {success}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
          >
            <TextField
              id="fullName"
              name="fullName"
              label="Full name"
              value={fullName}
              onChange={(event) => {
                setFullName(
                  event.target.value,
                );
              }}
              autoComplete="name"
              autoFocus
              required
              fullWidth
              disabled={isSubmitting}
              sx={{
                mb: 2,
              }}
            />

            <TextField
              id="email"
              name="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              autoComplete="email"
              required
              fullWidth
              disabled={isSubmitting}
              sx={{
                mb: 2,
              }}
            />

            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value,
                );
              }}
              autoComplete="new-password"
              helperText="Password must contain at least 5 characters."
              required
              fullWidth
              disabled={isSubmitting}
              sx={{
                mb: 2,
              }}
            />

            <TextField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value,
                );
              }}
              autoComplete="new-password"
              required
              fullWidth
              disabled={isSubmitting}
              sx={{
                mb: 2,
              }}
            />

            <FormControl
              fullWidth
              required
              disabled={isSubmitting}
              sx={{
                mb: 2,
              }}
            >
              <InputLabel id="role-label">
                Role
              </InputLabel>

              <Select
                labelId="role-label"
                id="role"
                name="role"
                label="Role"
                value={role}
                onChange={(event) => {
                  handleRoleChange(
                    event.target
                      .value as UserRole,
                  );
                }}
              >
                <MenuItem value="SuperAdmin">
                  Super Admin
                </MenuItem>

                <MenuItem value="DepartmentAdmin">
                  Department Admin
                </MenuItem>

                <MenuItem value="Employee">
                  Employee
                </MenuItem>
              </Select>
            </FormControl>

            {role !== "SuperAdmin" && (
              <TextField
                id="departmentId"
                name="departmentId"
                label="Department ID"
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(
                    event.target.value,
                  );
                }}
                placeholder="Enter the department GUID"
                helperText="Copy the department ID from the Departments table."
                required
                fullWidth
                disabled={isSubmitting}
                sx={{
                  mb: 2,
                }}
              />
            )}

            {role === "Employee" && (
              <TextField
                id="employeeId"
                name="employeeId"
                label="Employee ID"
                value={employeeId}
                onChange={(event) => {
                  setEmployeeId(
                    event.target.value,
                  );
                }}
                placeholder="Enter the employee GUID"
                helperText="Copy the employee ID from the Employees table."
                required
                fullWidth
                disabled={isSubmitting}
                sx={{
                  mb: 3,
                }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{
                minHeight: 48,
              }}
            >
              {isSubmitting ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Create account"
              )}
            </Button>
          </Box>

          <Typography
            align="center"
            color="text.secondary"
            sx={{
              mt: 3,
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

async function readResponseBody(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type");

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return {};
  }

  return {
    message: text,
  };
}

function getErrorMessage(
  responseBody: unknown,
  fallbackMessage: string,
): string {
  if (
    typeof responseBody !== "object" ||
    responseBody === null
  ) {
    return fallbackMessage;
  }

  const apiError =
    responseBody as ApiErrorResponse;

  if (
    typeof apiError.message === "string" &&
    apiError.message.trim()
  ) {
    return apiError.message;
  }

  if (
    Array.isArray(apiError.errors) &&
    apiError.errors.length > 0
  ) {
    return apiError.errors.join(" ");
  }

  return fallbackMessage;
}