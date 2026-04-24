import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AlumnoPage() {
  return (
    <DashboardShell title="Perfil Alumno">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Historial de commits</h2>
        <p className="text-sm text-slate-600">
          Vista base para mostrar repositorios vinculados y actividad de los ultimos 365 dias.
        </p>
      </section>
    </DashboardShell>
  );
}
