const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function handleUnauthorized(path: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("rc.auth.session");
  if (!path.startsWith("/auth/login")) {
    window.location.href = "/login?expired=1";
  }
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  const fallback = `API request failed: ${response.status}`;

  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(path);
    }
    throw new ApiError(response.status, await readErrorDetail(response));
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(path);
    }
    throw new ApiError(response.status, await readErrorDetail(response));
  }

  return response.json() as Promise<T>;
}
