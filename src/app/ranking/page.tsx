import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RankingTable } from "@/components/ranking/ranking-table";
import type { RankingItem } from "@/types";

const mockItems: RankingItem[] = [
  {
    usuario_id: 1,
    nombre: "Alumno Demo",
    grupo: "A-2026",
    puntos_commits: 220,
    puntos_docente: 80,
    puntos_proyecto: 90,
    total: 390,
  },
];

export default function RankingPage() {
  return (
    <DashboardShell title="Ranking General">
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel rounded-[1.8rem] p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Live leaderboard</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white">
            Visualiza desempeno academico con lectura ejecutiva y desglose accionable.
          </h2>
          <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
            El ranking combina actividad valida en GitHub, criterio docente y relevancia de proyecto para evitar lecturas superficiales.
          </p>
        </article>
        <article className="glass-panel rounded-[1.8rem] p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--warm)]">Snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-white">390</p>
              <p className="text-sm text-[color:var(--muted)]">top score actual</p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-white">A-2026</p>
              <p className="text-sm text-[color:var(--muted)]">grupo lider</p>
            </div>
          </div>
        </article>
      </section>

      <section className="glass-panel mb-6 rounded-[1.6rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Segmentacion</p>
            <p className="mt-2 text-lg font-medium text-white">Filtros listos para grupo, carrera, semestre y docente.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {["General", "Grupo A-2026", "Semestre 6", "Docente ISC"].map((filter) => (
              <span
                key={filter}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-[color:var(--muted)]"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      </section>

      <RankingTable items={mockItems} />
    </DashboardShell>
  );
}
