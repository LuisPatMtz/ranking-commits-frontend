import Link from "next/link";
import Image from "next/image";

const features = [
  { icon: "📊", title: "Ranking en tiempo real", desc: "Sigue el progreso de commits y calificaciones" },
  { icon: "🔗", title: "GitHub sincronizado", desc: "Sincronización automática de repositorios" },
  { icon: "🏆", title: "Competencia sana", desc: "Mejora tus habilidades de desarrollo gamificadas" },
];

export default function Home() {
  return (
    <div 
      className="relative flex min-h-screen flex-col w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a16 0%, #16160f 50%, #1a1a16 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 20s ease infinite'
      }}
    >
      {/* BACKGROUND ACCENTS */}
      <div className="soft-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-[color:var(--accent)]/5 blur-[120px] pointer-events-none" />

      {/* TOP NAVIGATION */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 lg:px-10 lg:py-8 mx-auto w-full max-w-7xl">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Ranking Commits Logo" width={32} height={32} className="opacity-90" priority />
          <span className="font-serif text-sm sm:text-base font-semibold tracking-widest text-[color:var(--accent)]">RANKING COMMITS</span>
        </div>
        <nav className="flex items-center gap-4 sm:gap-5">
          <Link href="/login" className="text-xs sm:text-sm font-semibold text-[color:var(--muted)] hover:text-white transition">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="rounded-sm border border-white/10 bg-white/5 px-4 py-2 sm:px-5 sm:py-2 font-serif text-xs sm:text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]/35 hover:bg-white/10">
            Registrarse
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT - TWO COLUMNS */}
      <main className="relative z-10 flex flex-1 items-center mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN - TEXT & FEATURES */}
          <div className="space-y-8 lg:pr-10">
            <div>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[color:var(--foreground)] leading-[1.1]">
                Ranking<br />Commits
              </h1>
              <p className="mt-6 font-serif text-xl sm:text-2xl leading-snug text-[color:var(--foreground)]">
                Desarrolla tu potencial competitivo a través de <span className="text-[color:var(--accent)]">código real</span> y gamificación.
              </p>
              <p className="mt-5 text-sm leading-6 text-[color:var(--muted)] tracking-wide max-w-xl">
                Para estudiantes: sube en el ranking de tu clase y mejora tus habilidades. Para docentes: sincroniza GitHub, define criterios y evalúa automáticamente el progreso de tus grupos.
              </p>
            </div>

            {/* FEATURES GRID */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 pt-6 border-t border-[color:var(--border)]">
              {features.map((feature) => (
                <div key={feature.title} className="space-y-1.5 border-l-2 border-[color:var(--accent)] pl-4">
                  <div className="text-2xl">{feature.icon}</div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">{feature.title}</h3>
                  <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - FLOATING CARD */}
          <div className="flex justify-center lg:justify-end mt-10 lg:mt-0">
            <div className="glass-panel w-full max-w-[28rem] rounded-[2rem] p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
               {/* Card subtle background glow */}
               <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[color:var(--warm)]/10 blur-3xl" />
               
               <div className="relative mb-6 p-5 rounded-[1.5rem] bg-white/5 border border-white/10 shadow-inner">
                 <Image src="/logo.png" alt="Ranking Commits Logo" width={72} height={72} className="opacity-90 drop-shadow-md" priority />
               </div>
               
               <h2 className="relative font-serif text-2xl sm:text-3xl font-semibold text-white mb-3">Únete a la plataforma</h2>
               <p className="relative text-sm text-[color:var(--muted)] mb-8 leading-relaxed px-4">
                 Crea tu cuenta ahora para consultar tus rankings, sincronizar tu código o gestionar tus grupos.
               </p>
               
               <Link 
                 href="/registro" 
                 className="relative w-full block rounded-xl bg-[color:var(--accent)] py-4 font-serif text-lg font-semibold text-[#1a1a16] transition-all hover:bg-[color:var(--accent-strong)] hover:shadow-[0_0_25px_rgba(201,168,118,0.4)] hover:-translate-y-0.5 active:translate-y-0"
               >
                 Comenzar ahora
               </Link>
               
               <div className="relative mt-8 flex flex-col items-center gap-3">
                 <p className="text-xs text-[color:var(--muted)] font-mono uppercase tracking-widest">
                   ¿Ya tienes una cuenta?
                 </p>
                 <Link 
                   href="/login" 
                   className="text-sm font-semibold text-[color:var(--foreground)] underline decoration-white/20 underline-offset-4 transition hover:text-[color:var(--accent)] hover:decoration-[color:var(--accent)]"
                 >
                   Acceder a mi panel
                 </Link>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
