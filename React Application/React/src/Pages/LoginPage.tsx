import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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

interface LoginResponse {
  token: string;
  expiresAtUtc: string;
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

interface StoredUser {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string | null;
  employeeId: string | null;
  expiresAtUtc: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5000";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ) => {
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
        `${API_BASE_URL}/api/auth/login`,
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
        throw new Error(
          getErrorMessage(
            responseBody,
            "Login failed. Check your email and password.",
          ),
        );
      }

      const loginResponse =
        responseBody as LoginResponse;

      if (!loginResponse.token) {
        throw new Error(
          "The API did not return an authentication token.",
        );
      }

      const storedUser: StoredUser = {
        userId: loginResponse.userId,
        fullName: loginResponse.fullName,
        email: loginResponse.email,
        role: loginResponse.role,
        departmentId:
          loginResponse.departmentId,
        employeeId:
          loginResponse.employeeId,
        expiresAtUtc:
          loginResponse.expiresAtUtc,
      };

      localStorage.setItem(
        "authToken",
        loginResponse.token,
      );

      localStorage.setItem(
        "authUser",
        JSON.stringify(storedUser),
      );

      navigate("/dashboard", {
        replace: true,
      });
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
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Sign in"
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
            Do not have an account?{" "}
            <Link
              to="/signup"
              style={{
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create an account
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