"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { readAuthSession, resolveDashboardPath, saveAuthSession, type AuthSession } from "@/features/auth/session";
import { ApiError, apiPost } from "@/lib/api";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string>(() => (searchParams.get("expired") === "1" ? "Tu sesión ha expirado. Por favor, inicia sesión nuevamente." : ""));
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
      setResult("Completa usuario y contraseña para continuar.");
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
        setResult("No se pudo iniciar sesión. Verifica credenciales y backend.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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

      {/* TOP NAVIGATION (Minimal) */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 lg:px-10 lg:py-8 mx-auto w-full max-w-7xl">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
          <Image src="/logo.png" alt="Ranking Commits Logo" width={32} height={32} className="opacity-90" priority />
          <span className="font-serif text-sm sm:text-base font-semibold tracking-widest text-[color:var(--accent)]">RANKING COMMITS</span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row gap-10 lg:gap-12 w-full items-center justify-between">
          
          {/* Left side - Info */}
          <section className="flex-1 space-y-6 max-w-lg w-full">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest font-mono text-[color:var(--muted)]">Acceso a la plataforma</p>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[color:var(--foreground)] leading-tight">
                Bienvenido de vuelta
              </h1>
              <p className="text-sm leading-7 text-[color:var(--muted)] tracking-wide">
                Accede a tu cuenta para consultar tus rankings, sincronizar tus repositorios de GitHub y gestionar tu progreso en la plataforma.
              </p>
            </div>

            <div className="space-y-4 border-l-2 border-[color:var(--accent)] pl-6">
              <div>
                <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Ranking en tiempo real</h3>
                <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Sigue el progreso de commits y calificaciones</p>
              </div>
              <div>
                <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">GitHub sincronizado</h3>
                <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Trae datos reales de repositorios automáticamente</p>
              </div>
              <div>
                <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Competencia sana</h3>
                <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Mejora tus habilidades mediante la gamificación</p>
              </div>
            </div>
          </section>

          {/* Right side - Form */}
          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 sm:p-10 shadow-2xl relative">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2 text-center mb-8">
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Iniciar sesión</h2>
                  <p className="text-xs text-[color:var(--muted)]">Ingresa tus credenciales para continuar</p>
                </div>

                {result && (
                  <div className={`text-sm px-4 py-3 rounded-xl border ${result.includes("Bienvenido") ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/5 text-[color:var(--accent)]" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
                    <p className="flex items-start gap-2">
                      {!result.includes("Bienvenido") && (
                        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      <span className="flex-1 leading-snug">{result}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]/50 focus:bg-white/10"
                    placeholder="Usuario"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <input
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]/50 focus:bg-white/10"
                    placeholder="Contraseña"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <button
                  className="w-full rounded-xl bg-[color:var(--accent)] text-[#1a1a16] font-serif font-semibold text-base py-3 transition hover:bg-[color:var(--accent-strong)] hover:shadow-[0_0_15px_rgba(201,168,118,0.3)] disabled:opacity-60 disabled:shadow-none"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Validando..." : "Acceder"}
                </button>

                <div className="pt-6 mt-6 border-t border-white/10 text-center">
                  <p className="text-xs text-[color:var(--muted)] tracking-wide mb-3">¿No tienes una cuenta aún?</p>
                  <Link 
                    href="/registro" 
                    className="block w-full rounded-xl border border-white/10 bg-white/5 text-[color:var(--foreground)] font-serif text-sm py-3 transition hover:bg-white/10 hover:border-white/20"
                  >
                    Crear cuenta nueva
                  </Link>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
