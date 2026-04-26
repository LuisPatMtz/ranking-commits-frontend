"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { readAuthSession } from "@/features/auth/session";
import Link from "next/link";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ title, subtitle, headerActions, children }: DashboardShellProps) {
  const [session, setSession] = useState<ReturnType<typeof readAuthSession>>(null);

  useEffect(() => {
    setSession(readAuthSession());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="soft-grid absolute inset-0 opacity-20" />
      <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[color:var(--accent)]/8 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[color:var(--warm)]/8 blur-3xl" />

      <header className="relative z-10 px-6 py-6 lg:px-8">
        <div className="glass-panel mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[1.75rem] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
              <Image src="/logo.png" alt="Ranking Commits Logo" width={36} height={36} className="opacity-90" priority />
              <span className="font-serif text-sm font-semibold tracking-widest text-[color:var(--accent)] hidden sm:inline-block">RANKING COMMITS</span>
            </Link>
            
            <div className="h-12 w-px bg-white/10 hidden sm:block"></div>
            
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-[color:var(--accent)] hidden lg:flex">
                {session?.user.nombre?.slice(0, 1).toUpperCase() || "R"}
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[color:var(--accent)]">Bienvenido</p>
                <h1 className="mt-0.5 font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{session?.user.nombre || title}</h1>
                <p className="text-xs text-[color:var(--muted)]">{session?.user.username ? `@${session.user.username}` : title}</p>
              </div>
            </div>
          </div>
          {headerActions ? <div className="flex flex-wrap gap-3 lg:justify-end">{headerActions}</div> : null}
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-10 lg:px-8">{children}</main>
    </div>
  );
}
