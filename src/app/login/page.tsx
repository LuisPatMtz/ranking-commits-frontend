"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { readAuthSession, resolveDashboardPath, saveAuthSession, type AuthSession } from "@/features/auth/session";
import { ApiError, apiPost } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string>(() => (searchParams.get("expired") === "1" ? "Tu sesion expiro. Inicia sesion nuevamente." : ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentSession = readAuthSession();
    if (!currentSession) {
      return;
    }

    router.replace(resolveDashboardPath(currentSession.user.rol));
  }, [router, searchParams]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setResult("Completa usuario y contrasena para continuar.");
      return;
    }

    setIsSubmitting(true);
    setResult("Autenticando...");

    try {
      const response = await apiPost<AuthSession>("/auth/login", { username: normalizedUsername, password });
      saveAuthSession(response);
      setResult(`Bienvenido, ${response.user.nombre}. Redirigiendo a tu panel...`);
      router.push(resolveDashboardPath(response.user.rol));
    } catch (error) {
      if (error instanceof ApiError) {
        setResult(error.detail);
      } else {
        setResult("No se pudo iniciar sesion. Verifica credenciales y backend.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-white">
      <div className="soft-grid absolute inset-0 opacity-20" />
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
      <div className="absolute right-[-6rem] top-1/3 h-72 w-72 rounded-full bg-[color:var(--warm)]/10 blur-3xl" />

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-[2rem] p-8 lg:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--accent)]">Acceso academico</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-[-0.05em] text-white">
            Entra al centro de operaciones del ranking academico.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--muted)]">
            Ingresa como docente o con una cuenta administrativa para operar la plataforma academica.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Roles</p>
              <p className="mt-3 text-xl font-semibold">Admin y docente</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Seguridad</p>
              <p className="mt-3 text-xl font-semibold">JWT preparado</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Fuente</p>
              <p className="mt-3 text-xl font-semibold">Gestion academica</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleLogin} className="glass-panel w-full rounded-[2rem] p-8 lg:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--warm)]">Ingreso al panel</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">Iniciar sesion</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Usa un usuario del sistema para acceder al panel correspondiente.
          </p>
          <div className="mt-8 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
              placeholder="Usuario institucional"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
              placeholder="Contrasena"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <button
            className="mt-6 w-full rounded-full bg-[color:var(--accent)] px-4 py-3 font-medium text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validando acceso..." : "Entrar"}
          </button>
          <p className="mt-4 min-h-6 text-sm text-[color:var(--muted)]">{result}</p>
          <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-[color:var(--muted)]">
            El sistema te enviara automaticamente al panel de admin, docente o alumno segun tu rol.
          </div>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Eres docente y aun no tienes cuenta?{" "}
            <Link href="/registro" className="text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]">
              Registrate aqui
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
