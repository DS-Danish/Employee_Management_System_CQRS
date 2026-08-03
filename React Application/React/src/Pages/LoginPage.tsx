import { useState } from "react";
import type { SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import type {
  ApiErrorResponse,
  LoginResponse,
  StoredUser,
  UserRole,
} from "../Types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5000/api";

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState<string>("");

  const [password, setPassword] =
    useState<string>("");

  const [error, setError] =
    useState<string>("");

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        },
      );

      const responseBody =
        await readResponseBody(response);

      if (!response.ok) {
        const fallbackMessage =
          response.status === 401
            ? "The email address or password is incorrect."
            : `Login failed with status ${response.status}.`;

        throw new Error(
          getErrorMessage(
            responseBody,
            fallbackMessage,
          ),
        );
      }

      if (!isLoginResponse(responseBody)) {
        throw new Error(
          "The API returned an invalid login response.",
        );
      }

      const loginResponse: LoginResponse =
        responseBody;

      if (!loginResponse.token) {
        throw new Error(
          "The API did not return an authentication token.",
        );
      }

      const parsedRole =
        parseUserRole(loginResponse.role);

      if (!parsedRole) {
        throw new Error(
          `The API returned an unsupported account role: ${
            String(loginResponse.role)
          }.`,
        );
      }

      const storedUser: StoredUser = {
        userId: loginResponse.userId,
        fullName: loginResponse.fullName,
        email: loginResponse.email,
        role: parsedRole,
        departmentId:
          loginResponse.departmentId,
        employeeId:
          loginResponse.employeeId,
        expiresAtUtc:
          loginResponse.expiresAtUtc,
      };

      localStorage.setItem(
        TOKEN_KEY,
        loginResponse.token,
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(storedUser),
      );

      navigate(
        getDashboardPath(parsedRole),
        {
          replace: true,
        },
      );
    } catch (caughtError: unknown) {
      clearAuthentication();

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
        "An unexpected error occurred while signing in.",
      );
    } finally {
      setIsSubmitting(false);
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
            Sign in
          </Typography>

          <Typography
            align="center"
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            Sign in to the Employee Management System
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

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
          >
            <TextField
              id="email"
              name="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="email"
              autoFocus
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
                setPassword(event.target.value);
                setError("");
              }}
              autoComplete="current-password"
              required
              fullWidth
              disabled={isSubmitting}
              sx={{
                mb: 3,
              }}
            />

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
                <>
                  <CircularProgress
                    size={22}
                    color="inherit"
                    sx={{
                      mr: 1,
                    }}
                  />

                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

function getDashboardPath(
  role: UserRole,
): string {
  switch (role) {
    case "Employee":
      return "/employee/dashboard";

    case "TeamLead":
      return "/team-lead/dashboard";

    case "SuperAdmin":
      return "/super-admin/dashboard";
  }
}

function parseUserRole(
  role: unknown,
): UserRole | null {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role
    .trim()
    .replace(/[\s_-]+/g, "")
    .toLowerCase();

  switch (normalizedRole) {
    case "employee":
      return "Employee";

    case "teamlead":
      return "TeamLead";

    case "superadmin":
      return "SuperAdmin";

    default:
      return null;
  }
}

function isLoginResponse(
  value: unknown,
): value is LoginResponse {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const response =
    value as Partial<LoginResponse>;

  return (
    typeof response.token === "string" &&
    typeof response.userId === "string" &&
    typeof response.fullName === "string" &&
    typeof response.email === "string" &&
    typeof response.role === "string"
  );
}

async function readResponseBody(
  response: Response,
): Promise<unknown> {
  const responseText =
    await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return {
      message: responseText,
    };
  }
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
    responseBody as ApiErrorResponse & {
      title?: string;
    };

  if (
    typeof apiError.message === "string" &&
    apiError.message.trim()
  ) {
    return apiError.message;
  }

  if (
    typeof apiError.title === "string" &&
    apiError.title.trim()
  ) {
    return apiError.title;
  }

  if (
    Array.isArray(apiError.errors) &&
    apiError.errors.length > 0
  ) {
    return apiError.errors.join(" ");
  }

  return fallbackMessage;
}

function clearAuthentication(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}