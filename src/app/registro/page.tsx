"use client";

import Link from "next/link";
import { useState } from "react";

import { apiPost } from "@/lib/api";

type RegisterResponse = {
  id: number;
  username: string;
  rol: string;
};

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setResult("Creando cuenta docente...");

    try {
      const response = await apiPost<RegisterResponse>("/auth/register", {
        nombre,
        username,
        password,
      });
      setResult(`Cuenta docente creada: ${response.username}. Ya puedes iniciar sesion.`);
      setNombre("");
      setUsername("");
      setPassword("");
    } catch {
      setResult("No se pudo registrar la cuenta docente. Si el usuario ya existe, usa otro username.");
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
            <p className="text-xs uppercase tracking-widest font-mono text-[color:var(--muted)]">Registro docente</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[color:var(--foreground)] leading-tight">
              Inicia tu panel de evaluación
            </h1>
            <p className="text-sm leading-7 text-[color:var(--muted)] tracking-wide">
              Acceso rápido para docentes que desean crear grupos, administrar participantes y generar rankings basados en contribuciones reales a repositorios.
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-[color:var(--accent)] pl-6">
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Registro inmediato</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Crea tu cuenta docente en menos de un minuto</p>
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Sin complejidad</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Solo necesitas nombre, usuario y contraseña</p>
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Seguro</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Autenticación JWT, contraseñas hasheadas en backend</p>
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-[color:var(--foreground)]">Listo para usar</h3>
              <p className="text-xs leading-5 text-[color:var(--muted)] tracking-wide mt-1">Accede inmediatamente después del registro</p>
            </div>
          </div>
        </section>

        {/* Right side - Form */}
        <form onSubmit={handleRegister} className="flex-1 max-w-sm space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-mono text-[color:var(--muted)]">Crear cuenta</p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">Regístrate como docente</h2>
          </div>

          <div className="space-y-4">
            <input
              className="w-full bg-[color:var(--background-muted)] border border-[color:var(--border)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Nombre completo"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
            <input
              className="w-full bg-[color:var(--background-muted)] border border-[color:var(--border)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Nombre de usuario"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <input
              className="w-full bg-[color:var(--background-muted)] border border-[color:var(--border)] px-4 py-2.5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button 
            className="w-full bg-[color:var(--accent)] text-[#1a1a16] font-serif font-semibold text-sm px-4 py-2.5 transition hover:bg-[color:var(--accent-strong)]"
            type="submit"
          >
            Crear mi cuenta
          </button>

          {result && (
            <div className={`text-xs p-3 border-l-2 ${result.includes("Cuenta docente creada") ? "border-[color:var(--accent)] text-[color:var(--accent)]" : "border-[#d97706] text-[#f59e0b]"}`}>
              {result}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[color:var(--border)]">
            <p className="text-xs text-[color:var(--muted)] tracking-wide">¿Ya eres docente registrado?</p>
            <Link 
              href="/login" 
              className="block w-full text-center border border-[color:var(--border)] text-[color:var(--foreground)] font-serif text-sm px-4 py-2.5 transition hover:bg-[color:var(--background-muted)]"
            >
              Iniciar sesión
            </Link>
          </div>

          <p className="text-xs text-[color:var(--muted)] leading-5 text-center pt-2">
            Tu cuenta se creará con rol docente. Los participantes se gestionan desde tu panel una vez accedas.
          </p>
        </form>
      </div>
    </div>
  );
}
