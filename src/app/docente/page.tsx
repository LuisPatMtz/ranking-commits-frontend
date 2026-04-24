import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DocentePage() {
  return (
    <DashboardShell title="Dashboard Docente">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Evaluacion de alumnos</h2>
        <p className="text-sm text-slate-600">
          Aqui podras registrar calificacion docente e importancia del proyecto.
        </p>
      </section>
    </DashboardShell>
  );
}
