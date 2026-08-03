import type {
  ApiErrorResponse,
  AvailableEmployee,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "../Types/auth";

const configuredBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ??
  "https://localhost:7001";

const apiBaseUrl: string =
  configuredBaseUrl
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

async function readErrorMessage(
  response: Response,
): Promise<string> {
  const responseText: string =
    await response.text();

  if (!responseText) {
    return (
      `Request failed with status ` +
      `${response.status} ` +
      `${response.statusText}.`
    );
  }

  try {
    const error =
      JSON.parse(
        responseText,
      ) as ApiErrorResponse;

    if (
      Array.isArray(
        error.errors,
      )
    ) {
      return error.errors.join(" ");
    }

    if (
      error.errors &&
      typeof error.errors === "object"
    ) {
      const validationMessages: string[] =
        Object.values(
          error.errors,
        ).flatMap(
          (
            messages: string[],
          ): string[] =>
            messages,
        );

      if (
        validationMessages.length > 0
      ) {
        return validationMessages.join(
          " ",
        );
      }
    }

    return (
      error.message ??
      error.title ??
      `Request failed with status ${response.status}.`
    );
  } catch {
    return (
      `Request failed with status ` +
      `${response.status} ` +
      `${response.statusText}. ` +
      responseText
    );
  }
}

function getAuthenticationToken(): string {
  const token: string | null =
    localStorage.getItem(
      "authToken",
    );

  if (!token) {
    throw new Error(
      "You must be signed in as Super Admin.",
    );
  }

  return token;
}

export async function registerUser(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  const token: string =
    getAuthenticationToken();

  const response: Response =
    await fetch(
      `${apiBaseUrl}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify(
          request,
        ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
      ),
    );
  }

  return (
    await response.json()
  ) as RegisterResponse;
}

export async function getAvailableEmployees():
  Promise<AvailableEmployee[]> {
  const token: string =
    getAuthenticationToken();

  const response: Response =
    await fetch(
      `${apiBaseUrl}/api/auth/available-employees`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
      ),
    );
  }

  return (
    await response.json()
  ) as AvailableEmployee[];
}

export async function loginUser(
  request: LoginRequest,
): Promise<LoginResponse> {
  const response: Response =
    await fetch(
      `${apiBaseUrl}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          request,
        ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
      ),
    );
  }

  return (
    await response.json()
  ) as LoginResponse;
}