"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RankingTable } from "@/components/ranking/ranking-table";
import { ApiError, apiGet } from "@/lib/api";
import { readAuthSession } from "@/features/auth/session";
import type { GeneralRankingItem } from "@/types";

const METRICS = [
  { value: "todo", label: "Todo" },
  { value: "commits", label: "Commits" },
  { value: "contribuciones", label: "Contribuciones" },
] as const;

const PERIODS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "1y", label: "1 año" },
  { value: "all", label: "Todo" },
] as const;

type Metric = (typeof METRICS)[number]["value"];
type Period = (typeof PERIODS)[number]["value"];

export default function RankingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<GeneralRankingItem[]>([]);
  const [metric, setMetric] = useState<Metric>("todo");
  const [period, setPeriod] = useState<Period>("1y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = readAuthSession();
    if (session) setToken(session.access_token);
  }, []);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<GeneralRankingItem[]>(
          `/ranking/general?metric=${metric}&period=${period}`,
          token!,
        );
        setItems(data);
      } catch (e) {
        setError(e instanceof ApiError ? e.detail : "Error al cargar el ranking");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, metric, period]);

  const topScore = items[0]?.total_score ?? 0;
  const topGroup = items[0]?.group_name ?? "—";

  return (
    <DashboardShell title="Ranking General">
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel rounded-[1.8rem] p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Live leaderboard</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white">
            Ranking combinado: commits, racha de días y votos de compañeros.
          </h2>
          <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
            Cada componente pesa 33 / 33 / 34 puntos. El máximo posible es 100.
          </p>
        </article>
        <article className="glass-panel rounded-[1.8rem] p-7">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--warm)]">Snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-white">
                {loading ? "…" : topScore.toFixed(1)}
              </p>
              <p className="text-sm text-[color:var(--muted)]">top score actual</p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-white truncate">
                {loading ? "…" : topGroup}
              </p>
              <p className="text-sm text-[color:var(--muted)]">proyecto líder</p>
            </div>
          </div>
        </article>
      </section>

      {/* Filtros */}
      <section className="glass-panel mb-6 rounded-[1.6rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Métrica</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    metric === m.value
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
                      : "border-white/10 bg-white/6 text-[color:var(--muted)] hover:border-white/20"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Período</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    period === p.value
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
                      : "border-white/10 bg-white/6 text-[color:var(--muted)] hover:border-white/20"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="glass-panel rounded-[1.75rem] p-8 text-center text-sm text-[color:var(--muted)]">
          Cargando ranking…
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-[1.75rem] p-8 text-center text-sm text-[color:var(--muted)]">
          No hay datos para mostrar. Asegúrate de tener proyectos activos con alumnos.
        </div>
      ) : (
        <RankingTable items={items} />
      )}
    </DashboardShell>
  );
}
