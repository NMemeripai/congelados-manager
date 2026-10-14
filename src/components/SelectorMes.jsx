import { ChevronLeft, ChevronRight } from "lucide-react";
import { nombreMes, ultimosMeses } from "../lib/costeo";

/** Flechas para moverse entre meses (formato "YYYY-MM"). */
export default function SelectorMes({ mes, onChange }) {
  const anterior = ultimosMeses(mes, 2)[0];
  const [y, m] = mes.split("-").map(Number);
  const siguiente = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-1 rounded-xl border border-ink-300/50 bg-surface p-1">
      <button onClick={() => onChange(anterior)} className="rounded-lg p-1.5 text-ink-700 hover:bg-surface-muted" aria-label="Mes anterior">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[120px] text-center text-sm font-medium text-ink-900">{nombreMes(mes, true)}</span>
      <button onClick={() => onChange(siguiente)} className="rounded-lg p-1.5 text-ink-700 hover:bg-surface-muted" aria-label="Mes siguiente">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
