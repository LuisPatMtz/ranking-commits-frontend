import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AdminPage() {
  return (
    <DashboardShell title="Dashboard Administrador">
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel rounded-[1.8rem] p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Admin overview</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white">
            Orquesta usuarios, cohortes y repositorios desde un panel con lectura ejecutiva.
          </h2>
          <p className="mt-4 max-w-xl text-[color:var(--muted)]">
            La experiencia administrativa debe sentirse como un producto institucional: clara, confiable y lista para escalar.
          </p>
        </article>
        <article className="glass-panel rounded-[1.8rem] p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--warm)]">Estado</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-white">24</p>
              <p className="text-sm text-[color:var(--muted)]">usuarios activos sincronizados</p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-[-0.04em] text-white">06</p>
              <p className="text-sm text-[color:var(--muted)]">grupos listos para evaluacion</p>
            </div>
          </div>
        </article>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="glass-panel rounded-[1.5rem] p-5">
          <h2 className="text-lg font-semibold text-white">Usuarios</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Alta, edicion, activacion y asignacion de roles academicos.</p>
        </section>
        <section className="glass-panel rounded-[1.5rem] p-5">
          <h2 className="text-lg font-semibold text-white">Grupos</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Gestion por carrera, semestre y asignaciones activas.</p>
        </section>
        <section className="glass-panel rounded-[1.5rem] p-5">
          <h2 className="text-lg font-semibold text-white">Repositorios</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Control de fuentes GitHub asociadas a alumnos y proyectos.</p>
        </section>
      </div>
    </DashboardShell>
  );
}
