import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RankingTable } from "@/components/ranking/ranking-table";
import type { RankingItem } from "@/types";

const mockItems: RankingItem[] = [
  {
    usuario_id: 1,
    nombre: "Alumno Demo",
    grupo: "A-2026",
    puntos_commits: 220,
    puntos_docente: 80,
    puntos_proyecto: 90,
    total: 390,
  },
];

export default function RankingPage() {
  return (
    <DashboardShell title="Ranking General">
      <RankingTable items={mockItems} />
    </DashboardShell>
  );
}
