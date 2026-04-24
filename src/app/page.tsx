import Link from "next/link";

const metrics = [
  { label: "Sincronizacion GitHub", value: "Historial flexible", note: "sincroniza actividad real segun la ventana configurada" },
  { label: "Compartir grupos", value: "1 clic", note: "por link corto o invitacion entre docentes" },
  { label: "Ranking docente", value: "100 pts", note: "commits, criterio docente y proyecto en una sola tabla" },
];

const modules = [
  {
    href: "/docente",
    label: "Cursos y grupos",
    title: "Crea cursos, edita grupos y administra su estructura desde un solo panel docente.",
  },
  {
    href: "/docente",
    label: "Participantes",
    title: "Da de alta participantes con nombre, grupo y GitHub sin procesos innecesarios.",
  },
  {
    href: "/docente",
    label: "Sincronizacion GitHub",
    title: "Trae commits reales desde GitHub y actualiza el ranking del grupo sin salir del panel.",
  },
  {
    href: "/docente",
    label: "Compartir entre docentes",
    title: "Comparte grupos por invitacion o link corto y recibe notificaciones dentro del panel.",
  },
  {
    href: "/login",
    label: "Acceso al panel",
    title: "Entra al panel docente para ver ranking, alumnos, commits y evaluaciones en contexto.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="soft-grid absolute inset-0 opacity-25" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(125,249,198,0.16),transparent_58%)]" />

      <main className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10 lg:py-10">
        <header className="glass-panel flex items-center justify-between rounded-full px-5 py-3 text-sm text-[color:var(--muted)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--accent)]/15 font-mono text-xs text-[color:var(--accent)]">
              RC
            </span>
            <div>
              <p className="font-semibold text-white">Ranking Commits</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Inteligencia academica para evidencia tecnica, seguimiento docente y colaboracion entre grupos</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/" className="text-[color:var(--muted)] transition hover:text-white">
              Inicio
            </Link>
            <Link href="/login" className="text-[color:var(--muted)] transition hover:text-white">
              Acceso
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-white transition hover:border-[color:var(--accent)]/40 hover:bg-white/10"
            >
              Entrar al panel
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="glass-panel rounded-[2rem] p-8 lg:p-10">
            <div className="mb-6 inline-flex rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
              Seguimiento academico conectado con GitHub
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white lg:text-7xl">
              Gestiona grupos, participantes y ranking docente desde una sola vista que si corresponde a tu flujo real.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted)] lg:text-xl">
              Crea cursos, agrega participantes, sincroniza commits desde GitHub, comparte grupos con otros docentes y
              calcula el ranking con puntos por commits, calificacion del maestro y calificacion del proyecto.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--warm)] px-6 py-3 font-medium text-slate-950 transition hover:bg-[#ffbe4a]"
              >
                Entrar al panel
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="glass-panel rounded-[1.6rem] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">{metric.label}</p>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{metric.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="glass-panel group rounded-[1.5rem] p-6 transition hover:-translate-y-1 hover:border-[color:var(--accent)]/30"
            >
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--warm)]">{module.label}</p>
              <h2 className="mt-4 text-xl font-semibold leading-7 text-white">{module.title}</h2>
              <p className="mt-6 text-sm text-[color:var(--accent)] transition group-hover:translate-x-1">Explorar modulo</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
