import { useState } from "react";
import type { SyntheticEvent } from "react";

import {
  useNavigate,
} from "react-router-dom";

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

const configuredBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5262/api";

const API_BASE_URL: string =
  configuredBaseUrl.replace(
    /\/+$/,
    "",
  );

const LOGIN_URL: string =
  API_BASE_URL.endsWith("/api")
    ? `${API_BASE_URL}/auth/login`
    : `${API_BASE_URL}/api/auth/login`;

const TOKEN_KEY =
  "authToken";

const USER_KEY =
  "authUser";

export default function LoginPage():
  React.ReactElement {
  const navigate =
    useNavigate();

  const [
    email,
    setEmail,
  ] =
    useState<string>("");

  const [
    password,
    setPassword,
  ] =
    useState<string>("");

  const [
    error,
    setError,
  ] =
    useState<string>("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState<boolean>(
      false,
    );

  const handleSubmit = async (
    event:
      SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Email is required.",
      );

      return;
    }

    if (!password) {
      setError(
        "Password is required.",
      );

      return;
    }

    setIsSubmitting(
      true,
    );

    try {
      /*
       * The frontend sends only
       * email + password.
       *
       * The backend determines
       * the user's actual role.
       */
      const response =
        await fetch(
          LOGIN_URL,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  normalizedEmail,

                password,
              }),
          },
        );

      const responseBody =
        await readResponseBody(
          response,
        );

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

      if (
        !loginResponse.token
      ) {
        throw new Error(
          "The API did not return an authentication token.",
        );
      }

      if (
        !isUserRole(
          loginResponse.role,
        )
      ) {
        throw new Error(
          "The API returned an unsupported account role.",
        );
      }

      /*
       * Store the authenticated
       * user's details.
       *
       * Permissions come directly
       * from the backend login
       * response.
       */
      const storedUser:
        StoredUser = {
        userId:
          loginResponse.userId,

        fullName:
          loginResponse.fullName,

        email:
          loginResponse.email,

        role:
          loginResponse.role,

        departmentId:
          loginResponse.departmentId,

        employeeId:
          loginResponse.employeeId,

        expiresAtUtc:
          loginResponse.expiresAtUtc,

        permissions:
          Array.isArray(
            loginResponse.permissions,
          )
            ? loginResponse.permissions
            : [],
      };

      localStorage.setItem(
        TOKEN_KEY,
        loginResponse.token,
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          storedUser,
        ),
      );

      /*
       * Automatically redirect
       * according to the role
       * returned by the backend.
       */
      navigate(
        getDashboardPath(
          loginResponse.role,
        ),
        {
          replace:
            true,
        },
      );
    } catch (
      caughtError:
        unknown
    ) {
      clearAuthentication();

      if (
        caughtError instanceof TypeError
      ) {
        setError(
          `Could not connect to the API at ${API_BASE_URL}. ` +
            "Make sure the backend is running and VITE_API_BASE_URL is correct.",
        );

        return;
      }

      if (
        caughtError instanceof Error
      ) {
        setError(
          caughtError.message,
        );

        return;
      }

      setError(
        "An unexpected error occurred while signing in.",
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
    >
      <Box
        sx={{
          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          py:
            4,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width:
              "100%",

            p: {
              xs:
                3,

              sm:
                5,
            },

            borderRadius:
              3,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontWeight:
                700,
            }}
          >
            Sign in
          </Typography>

          <Typography
            align="center"
            color="text.secondary"
            sx={{
              mb:
                3,
            }}
          >
            Sign in to the
            Employee Management
            System
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb:
                  3,
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={
              handleSubmit
            }
            noValidate
          >
            <TextField
              id="email"
              name="email"
              label="Email address"
              type="email"
              value={
                email
              }
              onChange={
                event => {
                  setEmail(
                    event.target.value,
                  );

                  setError("");
                }
              }
              autoComplete="email"
              autoFocus
              required
              fullWidth
              disabled={
                isSubmitting
              }
              sx={{
                mb:
                  2,
              }}
            />

            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              value={
                password
              }
              onChange={
                event => {
                  setPassword(
                    event.target.value,
                  );

                  setError("");
                }
              }
              autoComplete="current-password"
              required
              fullWidth
              disabled={
                isSubmitting
              }
              sx={{
                mb:
                  3,
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={
                isSubmitting
              }
              sx={{
                minHeight:
                  48,
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress
                    size={22}
                    color="inherit"
                    sx={{
                      mr:
                        1,
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

function isUserRole(
  role:
    unknown,
): role is UserRole {
  return (
    role ===
      "Employee" ||
    role ===
      "TeamLead" ||
    role ===
      "SuperAdmin"
  );
}

function getDashboardPath(
  role:
    UserRole,
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

async function readResponseBody(
  response:
    Response,
): Promise<unknown> {
  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  if (!text) {
    return {};
  }

  return {
    message:
      text,
  };
}

function getErrorMessage(
  responseBody:
    unknown,

  fallbackMessage:
    string,
): string {
  if (
    typeof responseBody !==
      "object" ||
    responseBody ===
      null
  ) {
    return fallbackMessage;
  }

  const apiError =
    responseBody as ApiErrorResponse;

  if (
    typeof apiError.message ===
      "string" &&
    apiError.message.trim()
  ) {
    return apiError.message;
  }

  if (
    Array.isArray(
      apiError.errors,
    ) &&
    apiError.errors.length >
      0
  ) {
    return apiError.errors.join(
      " ",
    );
  }

  if (
    apiError.errors &&
    !Array.isArray(
      apiError.errors,
    )
  ) {
    const validationMessages:
      string[] =
      Object.values(
        apiError.errors,
      ).flat();

    if (
      validationMessages.length >
      0
    ) {
      return validationMessages.join(
        " ",
      );
    }
  }

  if (
    typeof apiError.title ===
      "string" &&
    apiError.title.trim()
  ) {
    return apiError.title;
  }

  return fallbackMessage;
}

function clearAuthentication():
  void {
  localStorage.removeItem(
    TOKEN_KEY,
  );

  localStorage.removeItem(
    USER_KEY,
  );
}