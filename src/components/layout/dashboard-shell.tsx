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

      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-10 lg:py-8 mx-auto w-full max-w-7xl">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
          <Image src="/logo.png" alt="Ranking Commits Logo" width={32} height={32} className="opacity-90" priority />
          <span className="font-serif text-sm sm:text-base font-semibold tracking-widest text-[color:var(--accent)]">RANKING COMMITS</span>
        </Link>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden sm:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[color:var(--accent)]">Bienvenido</p>
            <p className="text-sm sm:text-base font-semibold text-[color:var(--foreground)]">{session?.user.nombre}</p>
            <p className="text-xs text-[color:var(--muted)]">{session?.user.username ? `@${session.user.username}` : ""}</p>
          </div>
          {headerActions ? <div className="flex flex-wrap gap-2 sm:gap-3">{headerActions}</div> : null}
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-10 lg:px-8">{children}</main>
    </div>
  );
}
