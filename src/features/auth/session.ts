import type { UserRole } from "@/types";

export interface AuthUser {
  id: number;
  nombre: string;
  username: string;
  rol: UserRole;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

const AUTH_SESSION_KEY = "rc.auth.session";

const dashboardPaths: Record<UserRole, string> = {
  admin: "/admin",
  docente: "/docente",
  alumno: "/alumno",
};

export function resolveDashboardPath(role: UserRole): string {
  return dashboardPaths[role] || "/ranking";
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}