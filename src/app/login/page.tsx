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
    <div 
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a16 0%, #16160f 50%, #1a1a16 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 20s ease infinite'
      }}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col lg:flex-row gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14 min-h-screen items-center justify-center">
        
        {/* Left side - Info */}
        <section className="flex-1 space-y-8 max-w-2xl">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest font-mono text-[color:var(--muted)]">Acceso docente</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[color:var(--foreground)] leading-tight">
              Gestiona tu plataforma de evaluación
            </h1>
            <p className="text-sm leading-7 text-[color:var(--muted)] tracking-wide">
              Accede al panel docente para crear cursos, administrar participantes, sincronizar commits desde GitHub y generar rankings basados en contribuciones reales.
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-[color:var(--accent)] pl-6">
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Panel centralizado</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Todo lo que necesitas para evaluar en un solo lugar</p>
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Sync automático</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Trae datos reales de GitHub sin configuración compleja</p>
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Rankings transparentes</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Visualiza métricas claras basadas en criterios definidos por ti</p>
            </div>
          </div>
        </section>

        {/* Right side - Form */}
        <form onSubmit={handleLogin} className="flex-1 max-w-sm space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-mono text-[color:var(--muted)]">Iniciar sesión</p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Entra a tu panel</h2>
          </div>

          <div className="space-y-4">
            <input
              className="w-full bg-[color:var(--background-muted)] border border-[color:var(--border)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Usuario"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <input
              className="w-full bg-[color:var(--background-muted)] border border-[color:var(--border)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
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
            className="w-full bg-[color:var(--accent)] text-[#1a1a16] font-serif font-semibold text-sm px-4 py-2.5 transition hover:bg-[color:var(--accent-strong)] disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Validando..." : "Acceder"}
          </button>

          {result && (
            <div className={`text-xs p-3 border-l-2 ${result.includes("Bienvenido") ? "border-[color:var(--accent)] text-[color:var(--accent)]" : "border-[#d97706] text-[#f59e0b]"}`}>
              {result}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[color:var(--border)]">
            <p className="text-xs text-[color:var(--muted)] tracking-wide">¿No eres docente aún?</p>
            <Link 
              href="/registro" 
              className="block w-full text-center border border-[color:var(--border)] text-[color:var(--foreground)] font-serif text-sm px-4 py-2.5 transition hover:bg-[color:var(--background-muted)]"
            >
              Crear cuenta docente
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
