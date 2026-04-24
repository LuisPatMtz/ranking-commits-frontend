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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-white">
      <div className="soft-grid absolute inset-0 opacity-20" />
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
      <div className="absolute right-[-6rem] top-1/3 h-72 w-72 rounded-full bg-[color:var(--warm)]/10 blur-3xl" />

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-[2rem] p-8 lg:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--warm)]">Registro de docentes</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-[-0.05em] text-white">
            Da de alta tu acceso docente en menos de un minuto.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--muted)]">
            Solo necesitas nombre, nombre de usuario y contrasena. Los participantes se administran aparte y el admin va por un flujo separado.
          </p>
          <div className="mt-10 rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Nota</p>
            <p className="mt-3 text-base text-white">
              Esta pantalla crea usuarios con rol docente y password hasheada en el backend.
            </p>
          </div>
        </section>

        <form onSubmit={handleRegister} className="glass-panel w-full rounded-[2rem] p-8 lg:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--accent)]">Registro</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">Crear cuenta docente</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Tu usuario se crea con rol docente por defecto.</p>

          <div className="mt-8 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
              placeholder="Nombre completo"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
              placeholder="Nombre de usuario"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
              placeholder="Contrasena"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button className="mt-6 w-full rounded-full bg-[color:var(--warm)] px-4 py-3 font-medium text-slate-950 transition hover:bg-[#ffbe4a]" type="submit">
            Registrarme
          </button>
          <p className="mt-4 min-h-6 text-sm text-[color:var(--muted)]">{result}</p>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]">
              Inicia sesion aqui
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
