import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AdminPage() {
  return (
    <DashboardShell title="Dashboard Administrador">
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Usuarios</h2>
          <p className="text-sm text-slate-600">Alta, edicion y asignacion de roles.</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Grupos</h2>
          <p className="text-sm text-slate-600">Gestion por carrera, semestre y periodo.</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Repositorios</h2>
          <p className="text-sm text-slate-600">Control de repos conectados a alumnos.</p>
        </section>
      </div>
    </DashboardShell>
  );
}
