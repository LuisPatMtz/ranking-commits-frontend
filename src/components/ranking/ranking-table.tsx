import type { RankingItem } from "@/types";

interface RankingTableProps {
  items: RankingItem[];
}

export function RankingTable({ items }: RankingTableProps) {
  return (
    <div className="glass-panel overflow-hidden rounded-[1.75rem]">
      <table className="min-w-full text-sm text-white">
        <thead className="bg-white/6 text-left text-[color:var(--muted)]">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Alumno</th>
            <th className="px-4 py-3">Grupo</th>
            <th className="px-4 py-3">Contribuciones</th>
            <th className="px-4 py-3">🔥 Racha</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.group_id}-${item.usuario_id}-${index}`} className="border-t border-white/8 text-slate-100">
              <td className="px-4 py-4 font-mono text-xs text-[color:var(--muted)]">{String(index + 1).padStart(2, "0")}</td>
              <td className="px-4 py-4 font-medium">{item.nombre}</td>
              <td className="px-4 py-4 text-[color:var(--muted)]">{item.group_name}</td>
              <td className="px-4 py-4">{item.commits_count}</td>
              <td className="px-4 py-4">
                <span className={item.streak_days > 0 ? "font-medium text-orange-400" : "text-[color:var(--muted)]"}>
                  {item.streak_days > 0 ? `🔥 ${item.streak_days}d` : "—"}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex rounded-full bg-[color:var(--accent)]/14 px-3 py-1 font-semibold text-[color:var(--accent)]">
                  {item.total_score.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
