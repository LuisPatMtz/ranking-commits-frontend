"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { readAuthSession } from "@/features/auth/session";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import type { CompañeroVotable, GithubSyncResponse, MiPerfilAlumno, PeerVoteOut, VotoRecibidoOut, ZenQuote } from "@/types";

function StarSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (stars: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className={`text-xl transition-colors ${display >= star ? "text-amber-400" : "text-slate-600"}`}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function AlumnoPage() {
  const [token, setToken] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<MiPerfilAlumno | null>(null);
  const [companeros, setCompañeros] = useState<CompañeroVotable[]>([]);
  const [recibidos, setRecibidos] = useState<VotoRecibidoOut[]>([]);
  const [pendingVotes, setPendingVotes] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [voteError, setVoteError] = useState<string | null>(null);
  const [quote, setQuote] = useState<ZenQuote | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<GithubSyncResponse | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = readAuthSession();
    if (!session) return;
    setToken(session.access_token);
  }, []);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [p, zenRes] = await Promise.all([
          apiGet<MiPerfilAlumno>("/alumnos/mi-perfil", token!),
          fetch("https://zenquotes.io/api/random").then((r) => r.json()).catch(() => null),
        ]);
        setPerfil(p);
        if (Array.isArray(zenRes) && zenRes[0]) setQuote(zenRes[0] as ZenQuote);

        if (p.proyecto_id && p.peer_voting_enabled) {
          const [comp, rec] = await Promise.all([
            apiGet<CompañeroVotable[]>(`/proyectos/${p.proyecto_id}/votos/companeros`, token!),
            apiGet<VotoRecibidoOut[]>(`/proyectos/${p.proyecto_id}/votos/recibidos`, token!),
          ]);
          setCompañeros(comp);
          setRecibidos(rec);
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.detail : "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  async function handleSync() {
    if (!perfil || !token) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await apiPost<GithubSyncResponse>(`/github/sync/${perfil.usuario_id}`, {}, token);
      setSyncResult(result);
      const p = await apiGet<MiPerfilAlumno>("/alumnos/mi-perfil", token);
      setPerfil(p);
    } catch (e) {
      setSyncError(e instanceof ApiError ? e.detail : "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  async function submitVote(votado_id: number) {
    if (!perfil?.proyecto_id || !token) return;
    const estrellas = pendingVotes[votado_id];
    if (!estrellas) return;

    setSubmitting((s) => ({ ...s, [votado_id]: true }));
    setVoteError(null);

    try {
      const result = await apiPost<PeerVoteOut>(
        `/proyectos/${perfil.proyecto_id}/votos`,
        { votado_id, estrellas },
        token,
      );
      setCompañeros((prev) =>
        prev.map((c) => (c.usuario_id === votado_id ? { ...c, mi_voto: result.estrellas } : c)),
      );
      setPendingVotes((prev) => {
        const next = { ...prev };
        delete next[votado_id];
        return next;
      });
    } catch (e) {
      setVoteError(e instanceof ApiError ? e.detail : "Error al enviar el voto");
    } finally {
      setSubmitting((s) => ({ ...s, [votado_id]: false }));
    }
  }

  if (loading) {
    return (
      <DashboardShell title="Mi perfil">
        <p className="text-[color:var(--muted)]">Cargando...</p>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell title="Mi perfil">
        <p className="text-red-400">{error}</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Mi perfil">
      <div className="space-y-6">
        {/* Frase motivadora */}
        {quote && (
          <section className="rounded-[1.75rem] border border-white/8 bg-white/3 px-6 py-4">
            <p className="text-sm italic text-[color:var(--muted)]">"{quote.q}"</p>
            <p className="mt-1 text-xs text-[color:var(--accent)]">— {quote.a}</p>
          </section>
        )}

        {/* Resumen */}
        <section className="glass-panel rounded-[1.75rem] p-6">
          <h2 className="mb-4 font-semibold text-[color:var(--accent)]">Resumen</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Nombre" value={perfil?.nombre ?? "—"} />
            <Stat label="GitHub" value={perfil?.github_username ? `@${perfil.github_username}` : "—"} />
            <Stat label="Proyecto" value={perfil?.proyecto_nombre ?? "Sin proyecto"} />
            <Stat label="Commits" value={String(perfil?.commits_count ?? 0)} />
            <Stat label="🔥 Racha" value={`${perfil?.streak_days ?? 0} días`} />
            <Stat label="⭐ Estrellas" value={perfil?.peer_vote_avg ? perfil.peer_vote_avg.toFixed(1) : "—"} />
          </div>
          {perfil?.mi_rank && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/8 px-4 py-3">
              <span className="text-2xl font-bold text-[color:var(--accent)]">#{perfil.mi_rank}</span>
              <span className="text-sm text-[color:var(--muted)]">
                de {perfil.total_en_proyecto ?? "?"} en tu proyecto
              </span>
              <span className="ml-auto rounded-full bg-[color:var(--accent)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
                Score {perfil.promedio.toFixed(1)}
              </span>
            </div>
          )}
        </section>

        {/* Sync de commits */}
        {perfil?.github_username && (
          <section className="glass-panel rounded-[1.75rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[color:var(--accent)]">Sincronizar commits</h2>
                <p className="text-xs text-[color:var(--muted)]">
                  Actualiza tus commits desde GitHub (@{perfil.github_username})
                </p>
              </div>
              <button
                onClick={() => void handleSync()}
                disabled={syncing}
                className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-black transition hover:opacity-80 disabled:opacity-40"
              >
                {syncing ? "Sincronizando…" : "↻ Actualizar mis commits"}
              </button>
            </div>
            {syncResult && (
              <p className="mt-3 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
                ✓ Sync completado — {syncResult.commits_nuevos} commits nuevos,{" "}
                {syncResult.repos_nuevos} repos nuevos.
              </p>
            )}
            {syncError && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{syncError}</p>
            )}
          </section>
        )}

        {/* Votación entre pares */}
        {perfil?.peer_voting_enabled && perfil.proyecto_id && (
          <section className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="mb-1 font-semibold text-[color:var(--accent)]">Vota a tus compañeros</h2>
            <p className="mb-4 text-xs text-[color:var(--muted)]">
              Periodo actual: {new Date().toISOString().slice(0, 7)} &mdash; un voto por compañero por mes.
            </p>

            {voteError && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{voteError}</p>
            )}

            {companeros.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No hay compañeros en tu grupo todavía.</p>
            ) : (
              <ul className="space-y-3">
                {companeros.map((c) => {
                  const selected = pendingVotes[c.usuario_id] ?? null;
                  const isSubmitting = submitting[c.usuario_id] ?? false;
                  const hasVoted = c.mi_voto != null && selected == null;

                  return (
                    <li
                      key={c.usuario_id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{c.nombre}</p>
                        {c.github_username && (
                          <p className="text-xs text-[color:var(--muted)]">@{c.github_username}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {hasVoted && (
                          <span className="text-xs text-[color:var(--muted)]">
                            Votaste: {"★".repeat(c.mi_voto!)}
                          </span>
                        )}
                        <StarSelector
                          value={selected ?? c.mi_voto ?? null}
                          onChange={(stars) =>
                            setPendingVotes((prev) => ({ ...prev, [c.usuario_id]: stars }))
                          }
                        />
                        {selected != null && (
                          <button
                            onClick={() => void submitVote(c.usuario_id)}
                            disabled={isSubmitting}
                            className="rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-black transition hover:opacity-80 disabled:opacity-40"
                          >
                            {isSubmitting ? "..." : hasVoted ? "Actualizar" : "Votar"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* Notificaciones de votos recibidos */}
        {perfil?.peer_voting_enabled && perfil.proyecto_id && (
          <section className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="mb-4 font-semibold text-[color:var(--accent)]">
              🔔 Notificaciones — votos recibidos
            </h2>
            {recibidos.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Aun no tienes votos este periodo.</p>
            ) : (
              <ul className="space-y-2">
                {recibidos.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                  >
                    <span className="text-lg">⭐</span>
                    <span className="font-medium">{v.votante_nombre}</span>
                    <span className="text-xs text-[color:var(--muted)]">te votó en este proyecto</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Sin proyecto */}
        {!perfil?.proyecto_id && (
          <section className="rounded-[1.75rem] border border-white/8 bg-white/3 p-6 text-center">
            <p className="text-[color:var(--muted)]">Aun no estas asignado a ningun proyecto.</p>
          </section>
        )}

        {/* Voting deshabilitado */}
        {perfil?.proyecto_id && !perfil.peer_voting_enabled && (
          <section className="rounded-[1.75rem] border border-white/8 bg-white/3 p-6 text-center">
            <p className="text-sm text-[color:var(--muted)]">
              Las votaciones entre pares no estan habilitadas en tu grupo.
            </p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--muted)]">{label}</p>
      <p className="font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
