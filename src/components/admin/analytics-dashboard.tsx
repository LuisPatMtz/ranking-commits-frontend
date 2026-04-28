"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { ApiError, apiGet } from "@/lib/api";

type AnalyticsDashboardStats = {
  overall: {
    total_commits: number;
    active_students: number;
    total_students: number;
    participation_rate: number;
  };
  thirty_days: {
    commits: number;
    avg_per_day: number;
    growth_percentage: number;
    peak_day_commits: number;
    peak_day_date: string | null;
  };
  ninety_days: {
    commits: number;
    active_streak_users: number;
  };
  one_year: {
    commits: number;
  };
  top_students: Array<{
    nombre: string;
    github_username: string;
    contributions: number;
  }>;
  hours_distribution: Array<{
    hour: number;
    count: number;
  }>;
  weekly_trend: Array<{
    date: string;
    commits: number;
  }>;
  daily_contributions: Array<{
    date: string;
    contributions: number;
  }>;
  daily_active_students: Array<{
    date: string;
    active_students: number;
  }>;
};

interface AnalyticsDashboardProps {
  accessToken: string | undefined;
}

export function AnalyticsDashboard({ accessToken }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<AnalyticsDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    async function load() {
      setIsLoading(true);
      setFeedback("");
      try {
        const data = await apiGet<AnalyticsDashboardStats>(
          "/analytics/dashboard-stats",
          accessToken
        );
        setStats(data);
      } catch (err) {
        setFeedback(err instanceof ApiError ? err.detail : "Error cargando estadísticas.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-[color:var(--muted)]">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-[color:var(--muted)]">
          No hay datos disponibles para mostrar.
        </p>
      </div>
    );
  }

  const chartData = stats.daily_contributions.map((item, idx) => {
    const activeStudents = stats.daily_active_students.find(
      (d) => d.date === item.date
    );
    return {
      date: item.date,
      contributions: item.contributions,
      active_students: activeStudents?.active_students || 0,
    };
  });

  // Calcular máximo dinámicamente desde los datos de la gráfica (60 días)
  const maxDailyContributions = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.contributions))
    : 0;

  const maxDailyActiveStudents = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.active_students))
    : 0;

  // Encontrar la fecha con máximo de contribuciones
  const peakContributionDate = chartData.find(
    (d) => d.contributions === maxDailyContributions
  )?.date || null;

  return (
    <div className="space-y-6">
      {feedback && (
        <p className="border-l-2 border-[#d97706] pl-3 text-xs text-[#f59e0b]">
          {feedback}
        </p>
      )}

      {/* Métricas principales */}
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)] mb-3">
          Impacto estratégico del proyecto
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="glass-panel rounded-2xl p-5 space-y-2 border-l-4 border-emerald-500/50">
            <p className="text-3xl font-bold text-emerald-400">
              {stats.overall.total_commits.toLocaleString()}
            </p>
            <p className="text-xs text-[color:var(--muted)]">Contribuciones registradas</p>
            <p className="text-xs text-emerald-400/70">Historial completo del sistema</p>
          </article>

          <article className="glass-panel rounded-2xl p-5 space-y-2 border-l-4 border-blue-500/50">
            <p className="text-3xl font-bold text-blue-400">
              {stats.overall.active_students}/{stats.overall.total_students}
            </p>
            <p className="text-xs text-[color:var(--muted)]">Alumnos comprometidos</p>
            <p className="text-xs text-blue-400/70">
              {stats.overall.participation_rate.toFixed(1)}% de participación
            </p>
          </article>

          <article className="glass-panel rounded-2xl p-5 space-y-2 border-l-4 border-violet-500/50">
            <p className="text-3xl font-bold text-violet-400">
              {stats.thirty_days.commits}
            </p>
            <p className="text-xs text-[color:var(--muted)]">Contribuciones recientes</p>
            <p className="text-xs text-violet-400/70">
              Últimos 30 días
            </p>
          </article>

          <article
            className={`glass-panel rounded-2xl p-5 space-y-2 border-l-4 ${
              stats.thirty_days.growth_percentage >= 0
                ? "border-green-500/50"
                : "border-red-500/50"
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                stats.thirty_days.growth_percentage >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {stats.thirty_days.growth_percentage >= 0 ? "+" : ""}
              {stats.thirty_days.growth_percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-[color:var(--muted)]">Crecimiento</p>
            <p
              className={`text-xs ${
                stats.thirty_days.growth_percentage >= 0
                  ? "text-green-400/70"
                  : "text-red-400/70"
              }`}
            >
              vs período anterior
            </p>
          </article>
        </div>
      </section>

      {/* Gráfica de contribuciones por día - Estilo Facebook */}
      <section className="glass-panel rounded-[1.8rem] p-7 space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">
            Tendencia de actividad
          </p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--foreground)]">
                Contribuciones por día
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Últimos 60 días — Evolución de productividad
              </p>
            </div>
            {maxDailyContributions > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">
                  {maxDailyContributions}
                </p>
                <p className="text-xs text-[color:var(--muted)]">Máximo en un día</p>
                {peakContributionDate && (
                  <p className="text-xs text-cyan-400/70">{peakContributionDate}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-80 w-full -mx-4 -mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30, 30, 30, 0.9)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => value}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="contributions"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={false}
                fillOpacity={1}
                fill="url(#colorContrib)"
                name="Contribuciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Gráfica de alumnos activos por día - Estilo Facebook */}
      <section className="glass-panel rounded-[1.8rem] p-7 space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">
            Compromiso estudiantil
          </p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--foreground)]">
                Alumnos activos por día
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Cantidad de estudiantes con contribuciones
              </p>
            </div>
            {maxDailyActiveStudents > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">
                  {maxDailyActiveStudents}
                </p>
                <p className="text-xs text-[color:var(--muted)]">Máximo en un día</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-80 w-full -mx-4 -mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30, 30, 30, 0.9)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => value}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="active_students"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                fillOpacity={1}
                fill="url(#colorStudents)"
                name="Alumnos activos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Rachas activas y crecimiento anual */}
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)] mb-3">
          Indicadores de éxito
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="glass-panel rounded-2xl p-5 space-y-3 border border-orange-500/20">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-400">
                {stats.ninety_days.active_streak_users}
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                Alumnos en racha
              </p>
              <p className="text-xs text-orange-400/70">
                7+ días consecutivos
              </p>
            </div>
          </article>

          <article className="glass-panel rounded-2xl p-5 space-y-3 border border-cyan-500/20">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-cyan-400">
                {stats.one_year.commits.toLocaleString()}
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                Contribuciones anuales
              </p>
              <p className="text-xs text-cyan-400/70">
                Tendencia histórica
              </p>
            </div>
          </article>

          <article className="glass-panel rounded-2xl p-5 space-y-3 border border-pink-500/20">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-pink-400">
                {stats.thirty_days.avg_per_day.toFixed(1)}
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                Promedio diario
              </p>
              <p className="text-xs text-pink-400/70">
                Últimos 30 días
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Top estudiantes */}
      <section className="glass-panel rounded-[1.8rem] p-7 space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">
            Líderes de impacto
          </p>
          <h2 className="mt-2 font-serif text-xl font-semibold text-[color:var(--foreground)]">
            Top 5 contribuyentes
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Estudiantes con mayor participación en el proyecto
          </p>
        </div>

        <div className="space-y-3">
          {stats.top_students.map((student, index) => (
            <div
              key={student.github_username}
              className="flex items-center gap-4 rounded-lg border border-white/5 bg-gradient-to-r from-white/5 to-transparent px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[color:var(--foreground)] truncate">
                  {student.nombre}
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  @{student.github_username}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-amber-400">
                  {student.contributions}
                </p>
                <p className="text-xs text-[color:var(--muted)]">contribuciones</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mensaje estratégico */}
      <section className="glass-panel rounded-[1.8rem] p-7 space-y-3 border-l-4 border-purple-500/50 bg-gradient-to-r from-purple-500/5 to-transparent">
        <p className="font-mono text-xs uppercase tracking-widest text-purple-400">
          Insights estratégicos
        </p>
        <p className="font-serif text-lg font-semibold text-[color:var(--foreground)]">
          Resultados cuantificables del impacto académico
        </p>
        <p className="text-sm text-[color:var(--muted)] leading-relaxed">
          El sistema ha generado <span className="font-medium text-emerald-400">
            {stats.overall.total_commits.toLocaleString()} contribuciones
          </span> con la participación de <span className="font-medium text-blue-400">
            {stats.overall.active_students} alumnos
          </span>. La actividad experimentó un crecimiento de{" "}
          <span className="font-medium text-green-400">
            {stats.thirty_days.growth_percentage.toFixed(1)}%
          </span> en el período reciente, demostrando el impacto positivo de la gamificación y seguimiento colaborativo en la motivación estudiantil.
        </p>
      </section>
    </div>
  );
}
