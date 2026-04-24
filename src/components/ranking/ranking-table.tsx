import type { RankingItem } from "@/types";

interface RankingTableProps {
  items: RankingItem[];
}

export function RankingTable({ items }: RankingTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-700">
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
            <tr key={`${item.usuario_id}-${index}`} className="border-t border-slate-200">
              <td className="px-4 py-3">{index + 1}</td>
              <td className="px-4 py-3">{item.nombre}</td>
              <td className="px-4 py-3">{item.grupo}</td>
              <td className="px-4 py-3">{item.puntos_commits}</td>
              <td className="px-4 py-3">{item.puntos_docente}</td>
              <td className="px-4 py-3">{item.puntos_proyecto}</td>
              <td className="px-4 py-3 font-semibold">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
