export type UserRole = "admin" | "docente" | "alumno";

export interface User {
  id: number;
  nombre: string;
  username: string;
  github_username?: string | null;
  rol: UserRole;
  activo: boolean;
}

export interface Group {
  id: number;
  nombre: string;
  carrera: string;
  semestre: number;
  created_by_user_id?: number | null;
}

export interface TeacherShareTarget {
  id: number;
  nombre: string;
  username: string;
}

export interface GroupShareResponse {
  message: string;
  source_group_id: number;
  shared_group_id: number;
  target_docente_id: number;
  target_docente_username: string;
  copied_students: number;
}

export interface GroupShareLinkResponse {
  message: string;
  invite_code: string;
  invite_link: string;
  expires_in_minutes: number;
}

export interface GroupInviteCreatedResponse {
  message: string;
  invite_code: string;
  target_docente_id: number;
  target_docente_username: string;
}

export interface GroupInviteNotification {
  invite_code: string;
  source_group_id: number;
  source_group_nombre: string;
  source_group_carrera: string;
  source_group_semestre: number;
  invited_by_docente_id: number;
  invited_by_docente_username: string;
}

export interface Participant {
  id: number;
  usuario_id: number;
  github_username?: string | null;
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
