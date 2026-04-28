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
// Claves legacy que pudieron quedar de versiones anteriores del código
const LEGACY_KEYS = ["access_token", "token", "auth_token", "rc_token"];

const dashboardPaths: Record<UserRole, string> = {
  admin: "/admin",
  docente: "/docente",
  alumno: "/alumno",
};

export function resolveDashboardPath(role: UserRole): string {
  return dashboardPaths[role] || "/ranking";
}

function purgeLegacyKeys(): void {
  LEGACY_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
  // Elimina también la clave principal de localStorage si hubiera migrado a sessionStorage
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AuthSession;
  } catch {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  purgeLegacyKeys();
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  purgeLegacyKeys();
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}