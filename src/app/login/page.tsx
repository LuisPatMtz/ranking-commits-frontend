"use client";

import { useState } from "react";

import { apiPost } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string>("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setResult("Autenticando...");

    try {
      const response = await apiPost<{ access_token: string }>("/auth/login", { email, password });
      setResult(`Token recibido: ${response.access_token.slice(0, 18)}...`);
    } catch {
      setResult("No se pudo iniciar sesion. Verifica credenciales y backend.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleLogin} className="w-full space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Iniciar sesion</h1>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="w-full rounded-md bg-slate-900 px-3 py-2 text-white" type="submit">
          Entrar
        </button>
        <p className="text-sm text-slate-600">{result}</p>
      </form>
    </div>
  );
}
