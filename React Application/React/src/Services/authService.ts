import type {
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "../Types/auth";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "https://localhost:7001";

async function readErrorMessage(
  response: Response
): Promise<string> {
  try {
    const error =
      (await response.json()) as ApiErrorResponse;

    if (error.errors && error.errors.length > 0) {
      return error.errors.join(" ");
    }

    return error.message ?? "The request failed.";
  } catch {
    return "The server returned an unexpected response.";
  }
}

export async function registerUser(
  request: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(
    `${apiBaseUrl}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return (await response.json()) as RegisterResponse;
}

export async function loginUser(
  request: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(
    `${apiBaseUrl}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return (await response.json()) as LoginResponse;
}