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

export interface GroupStudent {
  participant_id: number;
  usuario_id: number;
  nombre: string;
  username: string;
  github_username?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
}

export interface GroupStudentCandidate {
  participant_id: number;
  usuario_id: number;
  nombre: string;
  username: string;
  github_username?: string | null;
}

export interface Participant {
  id: number;
  usuario_id: number;
  github_username?: string | null;
  activo: boolean;
}

export interface ParticipantQuickResult {
  participant_id: number;
  usuario_id: number;
  nombre: string;
  username: string;
  github_username?: string | null;
  grupo_id: number;
}

export interface CommitListItem {
  sha: string;
  mensaje: string;
  fecha: string;
  url: string;
  puntos: number;
  repo: string;
  owner: string;
}

export interface CommitListResponse {
  usuario_id: number;
  total: number;
  items: CommitListItem[];
}

export interface GithubSyncResponse {
  message: string;
  usuario_id: number;
  github_username: string;
  repos_nuevos: number;
  commits_nuevos: number;
  contribuciones_totales?: number | null;
  since: string;
}

export interface GroupRankingItem {
  rank: number;
  usuario_id: number;
  nombre: string;
  github_username?: string | null;
  commits_count: number;
  commits_points: number;
  docente_grade: number;
  proyecto_grade: number;
  promedio: number;
}

export interface GroupRankingGradesUpdatePayload {
  usuario_id: number;
  docente_grade?: number;
  proyecto_grade?: number;
}

export interface GeneralRankingItem {
  rank: number;
  group_id: number;
  group_name: string;
  usuario_id: number;
  nombre: string;
  github_username?: string | null;
  commits_count: number;
  contributions_count: number;
  metric_value: number;
  metric_points: number;
  docente_grade: number;
  proyecto_grade: number;
  total_score: number;
}
