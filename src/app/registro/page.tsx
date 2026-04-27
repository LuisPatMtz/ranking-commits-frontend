"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ApiError, apiGet, apiPost } from "@/lib/api";

type InviteInfo = {
  tipo: "docente" | "alumno";
  valid: boolean;
  grupo_nombre?: string | null;
  grupo_id?: number | null;
};

type RegisterResponse = {
  id: number;
  username: string;
  rol: string;
  grupo_id?: number;
};

function RegistroForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const tipo = (searchParams.get("tipo") ?? "") as "docente" | "alumno" | "";

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!inviteToken || (tipo !== "docente" && tipo !== "alumno")) {
      setIsValidating(false);
      return;
    }
    apiGet<InviteInfo>(`/auth/invite/validate?token=${inviteToken}&tipo=${tipo}`)
      .then((info) => setInviteInfo(info))
      .catch(() => setInviteInfo({ tipo: tipo as "docente" | "alumno", valid: false }))
      .finally(() => setIsValidating(false));
  }, [inviteToken, tipo]);

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (tipo === "docente") {
        const res = await apiPost<RegisterResponse>("/auth/register/docente", {
          invite_token: inviteToken,
          nombre,
          username,
          password,
        });
        setSuccessMessage(`Cuenta docente creada: @${res.username}. Ya puedes iniciar sesión.`);
      } else {
        const res = await apiPost<RegisterResponse>("/auth/register/alumno", {
          invite_token: inviteToken,
          nombre,
          username,
          password,
          github_username: githubUsername.trim() || null,
        });
        setSuccessMessage(
          `Cuenta creada: @${res.username}. Ya estás en el grupo. Puedes iniciar sesión.`
        );
      }
      setNombre("");
      setUsername("");
      setPassword("");
      setGithubUsername("");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.detail : "Error al crear la cuenta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Estado: sin token o tipo inválido ---
  if (!inviteToken || (tipo !== "docente" && tipo !== "alumno")) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #1a1a16 0%, #16160f 100%)" }}>
        <div className="max-w-sm space-y-6 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">Acceso restringido</p>
          <h1 className="font-serif text-3xl font-semibold text-[color:var(--foreground)]">
            Registro por invitación
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Para registrarte necesitas un link de invitación. Si eres docente, solicítalo al administrador. Si eres alumno, pídelo a tu profesor.
          </p>
          <Link href="/login" className="block border border-[color:var(--border)] px-4 py-2.5 text-center font-serif text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--background-muted)]">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  // --- Estado: validando ---
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a16 0%, #16160f 100%)" }}>
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">Verificando invitación...</p>
      </div>
    );
  }

  // --- Estado: invite inválida o expirada ---
  if (!inviteInfo?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #1a1a16 0%, #16160f 100%)" }}>
        <div className="max-w-sm space-y-6 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">Link inválido</p>
          <h1 className="font-serif text-3xl font-semibold text-[color:var(--foreground)]">
            Invitación expirada
          </h1>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Este link de invitación ya no es válido. Puede haber expirado o ya fue usado. Solicita uno nuevo.
          </p>
          <Link href="/login" className="block border border-[color:var(--border)] px-4 py-2.5 text-center font-serif text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--background-muted)]">
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  const isDocente = tipo === "docente";

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1a16 0%, #16160f 50%, #1a1a16 100%)" }}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:px-8 lg:py-14 min-h-screen">

        {/* Lado izquierdo — contexto */}
        <section className="max-w-2xl flex-1 space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
              {isDocente ? "Registro docente" : "Registro alumno"}
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-[color:var(--foreground)] sm:text-5xl">
              {isDocente
                ? "Activa tu panel de docente"
                : `Únete al grupo "${inviteInfo.grupo_nombre}"`}
            </h1>
            <p className="text-sm leading-7 tracking-wide text-[color:var(--muted)]">
              {isDocente
                ? "Fuiste invitado como docente. Crea tu cuenta para gestionar grupos, agregar alumnos y ver el ranking de actividad en GitHub."
                : "Tu profesor te ha invitado a este grupo. Crea tu cuenta para aparecer en el ranking y competir con tus compañeros."}
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-[color:var(--accent)] pl-6">
            {isDocente ? (
              <>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Crea grupos</h3>
                  <p className="mt-1 text-xs leading-5 tracking-wide text-[color:var(--muted)]">Gestiona tus alumnos por grupo, carrera y semestre</p>
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Ranking automático</h3>
                  <p className="mt-1 text-xs leading-5 tracking-wide text-[color:var(--muted)]">Basado en commits reales de GitHub, calificaciones y proyecto</p>
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Comparte con colegas</h3>
                  <p className="mt-1 text-xs leading-5 tracking-wide text-[color:var(--muted)]">Puedes compartir tus grupos con otros docentes</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Compite en el ranking</h3>
                  <p className="mt-1 text-xs leading-5 tracking-wide text-[color:var(--muted)]">Tu posición se actualiza con cada commit que hagas</p>
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Conecta tu GitHub</h3>
                  <p className="mt-1 text-xs leading-5 tracking-wide text-[color:var(--muted)]">Opcional pero recomendado — mejora la precisión de tus métricas</p>
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Solo ves tu grupo</h3>
                  <p className="mt-1 text-xs leading-5 tracking-wide text-[color:var(--muted)]">Tu panel es privado, solo tú y tu docente lo ven</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Lado derecho — formulario */}
        <form onSubmit={handleSubmit} className="max-w-sm flex-1 space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">Crear cuenta</p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
              {isDocente ? "Regístrate como docente" : "Regístrate como alumno"}
            </h2>
            {!isDocente && inviteInfo.grupo_nombre && (
              <p className="text-xs text-[color:var(--accent)]">
                Grupo: <span className="font-semibold">{inviteInfo.grupo_nombre}</span>
              </p>
            )}
          </div>

          <div className="space-y-4">
            <input
              className="w-full border border-[color:var(--border)] bg-[color:var(--background-muted)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Nombre completo"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <input
              className="w-full border border-[color:var(--border)] bg-[color:var(--background-muted)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Nombre de usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="w-full border border-[color:var(--border)] bg-[color:var(--background-muted)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isDocente && (
              <div className="space-y-1">
                <input
                  className="w-full border border-[color:var(--border)] bg-[color:var(--background-muted)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
                  placeholder="Usuario de GitHub (opcional)"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
                <p className="text-xs text-[color:var(--muted)]">
                  Recomendado para sincronizar tus commits automáticamente
                </p>
              </div>
            )}
          </div>

          <button
            className="w-full bg-[color:var(--accent)] px-4 py-2.5 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)] disabled:opacity-50"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}
          </button>

          {successMessage && (
            <div className="border-l-2 border-[color:var(--accent)] p-3 text-xs text-[color:var(--accent)]">
              {successMessage}{" "}
              <Link href="/login" className="underline">
                Iniciar sesión
              </Link>
            </div>
          )}

          {errorMessage && (
            <div className="border-l-2 border-[#d97706] p-3 text-xs text-[#f59e0b]">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
            <p className="text-xs tracking-wide text-[color:var(--muted)]">¿Ya tienes cuenta?</p>
            <Link
              href="/login"
              className="block w-full border border-[color:var(--border)] px-4 py-2.5 text-center font-serif text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--background-muted)]"
            >
              Iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
