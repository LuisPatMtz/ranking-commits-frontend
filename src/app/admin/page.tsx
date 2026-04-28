"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { readAuthSession } from "@/features/auth/session";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { User } from "@/types";

type Stats = {
  total_usuarios: number;
  total_docentes: number;
  total_alumnos: number;
  usuarios_activos: number;
  total_grupos: number;
  total_commits: number;
  total_participantes: number;
  invites_docente_pendientes: number;
  invites_alumno_activos: number;
};

type DocenteInvite = {
  id: number;
  token: string;
  usado: boolean;
  expires_at: string;
  created_at: string;
};

type GeneratedInvite = {
  invite_token: string;
  expires_in_hours: number;
  registro_url: string;
};

export default function AdminPage() {
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<DocenteInvite[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<GeneratedInvite | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [userFilter, setUserFilter] = useState<"all" | "docente" | "alumno" | "admin">("all");
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<"management" | "analytics">("management");

  useEffect(() => {
    const session = readAuthSession();
    setAccessToken(session?.access_token);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !accessToken) return;

    async function load() {
      setIsLoadingStats(true);
      setIsLoadingUsers(true);
      setIsLoadingInvites(true);
      try {
        const [statsData, usersData, invitesData] = await Promise.all([
          apiGet<Stats>("/usuarios/admin/stats", accessToken),
          apiGet<User[]>("/usuarios", accessToken),
          apiGet<DocenteInvite[]>("/usuarios/admin/invites-docente", accessToken),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setInvites(invitesData);
      } catch (err) {
        setFeedback(err instanceof ApiError ? err.detail : "Error cargando datos.");
      } finally {
        setIsLoadingStats(false);
        setIsLoadingUsers(false);
        setIsLoadingInvites(false);
      }
    }
    void load();
  }, [isHydrated, accessToken]);

  async function handleGenerateInvite() {
    setIsGeneratingInvite(true);
    setGeneratedInvite(null);
    setFeedback("");
    try {
      const res = await apiPost<GeneratedInvite>("/auth/invite/docente", {}, accessToken);
      setGeneratedInvite(res);
      // Refrescar stats e invites
      const [statsData, invitesData] = await Promise.all([
        apiGet<Stats>("/usuarios/admin/stats", accessToken),
        apiGet<DocenteInvite[]>("/usuarios/admin/invites-docente", accessToken),
      ]);
      setStats(statsData);
      setInvites(invitesData);
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.detail : "No se pudo generar la invitación.");
    } finally {
      setIsGeneratingInvite(false);
    }
  }

  async function copyLink(url: string) {
    const full = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(full);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  }

  async function handleToggleUser(userId: number) {
    setTogglingUserId(userId);
    try {
      const updated = await apiPatch<User>(`/usuarios/${userId}/toggle-activo`, {}, accessToken);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.detail : "Error cambiando estado.");
    } finally {
      setTogglingUserId(null);
    }
  }

  const filteredUsers = userFilter === "all" ? users : users.filter((u) => u.rol === userFilter);

  const statCards = stats
    ? [
        { label: "Usuarios totales", value: stats.total_usuarios },
        { label: "Docentes", value: stats.total_docentes },
        { label: "Alumnos", value: stats.total_alumnos },
        { label: "Grupos activos", value: stats.total_grupos },
        { label: "Commits registrados", value: stats.total_commits },
        { label: "Invites docente pendientes", value: stats.invites_docente_pendientes },
      ]
    : [];

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (!isHydrated) return null;

  return (
    <DashboardShell title="Panel de administración">
      {/* Tab Navigation */}
      <div className="mb-8 border-b border-white/10">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("management")}
            className={`py-3 px-1 font-medium text-sm transition border-b-2 ${
              activeTab === "management"
                ? "border-[color:var(--accent)] text-[color:var(--foreground)]"
                : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            Gestión
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-3 px-1 font-medium text-sm transition border-b-2 ${
              activeTab === "analytics"
                ? "border-[color:var(--accent)] text-[color:var(--foreground)]"
                : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            Estadísticas
          </button>
        </div>
      </div>

      {/* Management Tab */}
      {activeTab === "management" && (
        <>
          {/* Stats */}
          <section className="mb-6">
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)] mb-3">Métricas de la plataforma</p>
            {isLoadingStats ? (
              <p className="text-sm text-[color:var(--muted)]">Cargando métricas...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {statCards.map((card) => (
                  <article key={card.label} className="glass-panel rounded-2xl p-5 space-y-1">
                    <p className="text-3xl font-semibold text-[color:var(--foreground)]">{card.value}</p>
                    <p className="text-xs text-[color:var(--muted)] leading-4">{card.label}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {feedback && (
            <p className="mb-4 border-l-2 border-[#d97706] pl-3 text-xs text-[#f59e0b]">{feedback}</p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Generador de invitaciones */}
            <section className="glass-panel rounded-[1.8rem] p-7 space-y-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">Invitaciones de docente</p>
                <h2 className="mt-2 font-serif text-xl font-semibold text-[color:var(--foreground)]">
                  Genera un link de registro
                </h2>
                <p className="mt-1 text-sm text-[color:var(--muted)] leading-6">
                  El link es de un solo uso y expira en 72 horas. Mándalo directamente al docente por email o chat.
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-sm bg-[color:var(--accent)] px-4 py-3 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)] disabled:opacity-50"
                onClick={() => void handleGenerateInvite()}
                disabled={isGeneratingInvite}
              >
                {isGeneratingInvite ? "Generando..." : "Generar nuevo link de docente"}
              </button>

              {generatedInvite && (
                <div className="space-y-3">
                  <p className="text-xs text-[color:var(--muted)]">
                    Link válido por {generatedInvite.expires_in_hours} horas — un solo uso
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-[color:var(--foreground)] break-all">
                    {typeof window !== "undefined" ? `${window.location.origin}${generatedInvite.registro_url}` : generatedInvite.registro_url}
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-sm border border-[color:var(--accent)] px-4 py-2.5 font-serif text-sm text-[color:var(--accent)] transition hover:bg-[color:var(--accent)]/10"
                    onClick={() => void copyLink(generatedInvite.registro_url)}
                  >
                    {copiedInvite ? "¡Copiado!" : "Copiar link"}
                  </button>
                </div>
              )}

              {/* Historial de invites */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-xs text-[color:var(--muted)] uppercase font-mono tracking-widest">Últimas invitaciones</p>
                {isLoadingInvites ? (
                  <p className="text-xs text-[color:var(--muted)]">Cargando...</p>
                ) : invites.length === 0 ? (
                  <p className="text-xs text-[color:var(--muted)]">Sin invitaciones generadas aún.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-[color:var(--foreground)] truncate">{invite.token.slice(0, 16)}…</p>
                          <p className="text-xs text-[color:var(--muted)]">Expira: {formatDate(invite.expires_at)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${invite.usado ? "bg-white/10 text-[color:var(--muted)]" : "bg-[color:var(--accent)]/20 text-[color:var(--accent)]"}`}>
                          {invite.usado ? "Usado" : "Pendiente"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Lista de usuarios */}
            <section className="glass-panel rounded-[1.8rem] p-7 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">Usuarios</p>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-[color:var(--foreground)]">
                    {filteredUsers.length} {userFilter === "all" ? "en total" : userFilter + "s"}
                  </h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "admin", "docente", "alumno"] as const).map((rol) => (
                    <button
                      key={rol}
                      type="button"
                      onClick={() => setUserFilter(rol)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${userFilter === rol ? "bg-[color:var(--accent)] text-[#1a1a16]" : "border border-white/10 text-[color:var(--muted)] hover:border-white/20 hover:text-white"}`}
                    >
                      {rol === "all" ? "Todos" : rol.charAt(0).toUpperCase() + rol.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingUsers ? (
                <p className="text-sm text-[color:var(--muted)]">Cargando usuarios...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">Sin usuarios en esta categoría.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[color:var(--foreground)] truncate">{user.nombre}</p>
                        <p className="text-xs text-[color:var(--muted)]">@{user.username} · {user.rol}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.activo ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          {user.activo ? "Activo" : "Inactivo"}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--muted)] transition hover:border-white/20 hover:text-white disabled:opacity-40"
                          onClick={() => void handleToggleUser(user.id)}
                          disabled={togglingUserId === user.id}
                        >
                          {togglingUserId === user.id ? "..." : user.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <AnalyticsDashboard accessToken={accessToken} />
      )}
    </DashboardShell>
  );
}
