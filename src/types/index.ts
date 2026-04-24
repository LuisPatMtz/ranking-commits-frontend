export type UserRole = "admin" | "docente" | "alumno";

export interface User {
  id: number;
  nombre: string;
  email: string;
  github_username?: string | null;
  rol: UserRole;
  activo: boolean;
}

export interface RankingItem {
  usuario_id: number;
  nombre: string;
  grupo: string;
  puntos_commits: number;
  puntos_docente: number;
  puntos_proyecto: number;
  total: number;
}
