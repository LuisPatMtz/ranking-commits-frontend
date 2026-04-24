import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
        <section className="rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-3xl font-semibold">Ranking Commits Platform</h1>
          <p className="mt-2 text-slate-600">
            Base inicial de frontend para la plataforma academica de ranking por actividad en GitHub.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link href="/login" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400">
            <h2 className="font-semibold">Login</h2>
            <p className="text-sm text-slate-600">Acceso con JWT desde FastAPI.</p>
          </Link>
          <Link href="/admin" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400">
            <h2 className="font-semibold">Dashboard Admin</h2>
            <p className="text-sm text-slate-600">Gestion de usuarios, grupos y repositorios.</p>
          </Link>
          <Link href="/docente" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400">
            <h2 className="font-semibold">Dashboard Docente</h2>
            <p className="text-sm text-slate-600">Evaluacion y seguimiento de alumnos.</p>
          </Link>
          <Link href="/ranking" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400">
            <h2 className="font-semibold">Ranking General</h2>
            <p className="text-sm text-slate-600">Vista de resultados con desglose de puntajes.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
