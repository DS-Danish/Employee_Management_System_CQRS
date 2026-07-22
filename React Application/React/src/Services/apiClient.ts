const apiBaseUrl: string | undefined =
  import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is not configured in the .env file.",
  );
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly responseBody: string;

  public constructor(
    message: string,
    status: number,
    responseBody: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response: Response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const responseBody: string = await response.text();

    throw new ApiError(
      responseBody || `Request failed with status ${response.status}.`,
      response.status,
      responseBody,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText: string = await response.text();

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}