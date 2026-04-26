import Link from "next/link";

const features = [
  { icon: "📊", title: "Ranking en tiempo real", desc: "Visualiza commits y calificaciones" },
  { icon: "👥", title: "Gestión de grupos", desc: "Organiza participantes fácilmente" },
  { icon: "🔗", title: "GitHub sincronizado", desc: "Trae commits reales automáticamente" },
];

const modules = [
  {
    href: "/registro",
    label: "Registrate",
    title: "Crea una nueva cuenta",
  },
  {
    href: "/login",
    label: "Iniciar sesión",
    title: "Entra a tu cuenta",
  },
];

export default function Home() {
  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a16 0%, #16160f 50%, #1a1a16 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 20s ease infinite'
      }}
    >
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[color:var(--foreground)] leading-tight">
              Ranking<br />Commits
            </h1>
            <p className="mt-2 text-xs tracking-widest text-[color:var(--muted)] uppercase">Desarrolla competencia a través de commits</p>
          </div>
          <Link
            href="/login"
            className="rounded-sm bg-[color:var(--accent)] px-7 py-2.5 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)]"
          >
            Acceso
          </Link>
        </div>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="font-serif text-lg sm:text-xl leading-snug text-[color:var(--foreground)]">
              Una plataforma para <span className="font-semibold">docentes que evalúan a través de contribuciones reales</span> a repositorios.
            </p>
            <p className="text-xs leading-6 text-[color:var(--muted)] tracking-wide max-w-2xl">
              Sincroniza GitHub, define criterios de evaluación y genera rankings transparentes basados en la actividad real de commits, criterios docentes y evaluaciones de proyectos.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 pt-2">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-1.5 border-l-2 border-[color:var(--accent)] pl-4">
                <div className="text-2xl">{feature.icon}</div>
                <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">{feature.title}</h3>
                <p className="text-xs leading-4 text-[color:var(--muted)] tracking-wide">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-[color:var(--border)] pt-5">
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
            {modules.map((module) => (
              <Link
                key={module.label}
                href={module.href}
                className="group space-y-2 pb-4 border-b border-[color:var(--border)] transition hover:border-[color:var(--accent)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-mono text-[color:var(--muted)]">{module.label}</p>
                    <h2 className="font-serif text-sm font-semibold text-[color:var(--foreground)] mt-0.5">{module.title}</h2>
                  </div>
                  <p className="text-[color:var(--accent)] transition group-hover:translate-x-1 text-base">→</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
