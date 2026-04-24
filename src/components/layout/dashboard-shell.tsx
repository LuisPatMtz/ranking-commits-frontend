import Link from "next/link";

interface DashboardShellProps {
  title: string;
  children: React.ReactNode;
}

const links = [
  { href: "/admin", label: "Admin" },
  { href: "/docente", label: "Docente" },
  { href: "/alumno", label: "Alumno" },
  { href: "/ranking", label: "Ranking" },
];

export function DashboardShell({ title, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">{title}</h1>
          <nav className="flex gap-4 text-sm font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
