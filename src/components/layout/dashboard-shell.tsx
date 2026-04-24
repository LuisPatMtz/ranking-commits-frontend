"use client";

import { readAuthSession } from "@/features/auth/session";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ title, subtitle, headerActions, children }: DashboardShellProps) {
  const session = readAuthSession();

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="soft-grid absolute inset-0 opacity-20" />
      <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[color:var(--accent)]/8 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[color:var(--warm)]/8 blur-3xl" />

      <header className="relative z-10 px-6 py-6 lg:px-8">
        <div className="glass-panel mx-auto flex max-w-7xl flex-col gap-5 rounded-[1.75rem] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-[color:var(--accent)]">
              {session?.user.nombre?.slice(0, 1).toUpperCase() || "R"}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--accent)]">Bienvenido</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">{session?.user.nombre || title}</h1>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{session?.user.username ? `@${session.user.username}` : title}</p>
              {subtitle ? <p className="mt-1 text-sm text-[color:var(--muted)]/90">{subtitle}</p> : null}
            </div>
          </div>
          {headerActions ? <div className="flex flex-wrap gap-3 lg:justify-end">{headerActions}</div> : null}
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-10 lg:px-8">{children}</main>
    </div>
  );
}
