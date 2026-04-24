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
            <th className="px-4 py-3">Commits</th>
            <th className="px-4 py-3">Docente</th>
            <th className="px-4 py-3">Proyecto</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.usuario_id}-${index}`} className="border-t border-white/8 text-slate-100">
              <td className="px-4 py-4 font-mono text-xs text-[color:var(--muted)]">{String(index + 1).padStart(2, "0")}</td>
              <td className="px-4 py-4 font-medium">{item.nombre}</td>
              <td className="px-4 py-4 text-[color:var(--muted)]">{item.grupo}</td>
              <td className="px-4 py-4">{item.puntos_commits}</td>
              <td className="px-4 py-4">{item.puntos_docente}</td>
              <td className="px-4 py-4">{item.puntos_proyecto}</td>
              <td className="px-4 py-4">
                <span className="inline-flex rounded-full bg-[color:var(--accent)]/14 px-3 py-1 font-semibold text-[color:var(--accent)]">
                  {item.total}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
