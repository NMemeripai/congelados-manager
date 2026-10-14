import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { usePeriodo } from "../context/PeriodoContext";
import { TIPOS } from "../lib/periodos";

/** Filtro de período: Día / Semana / Mes / Año / Otro (rango personalizado). */
export default function SelectorPeriodo({ className }) {
  const p = usePeriodo();
  return (
    <div className={clsx("flex w-full flex-col gap-2 lg:max-w-xl", className)}>
      <div role="radiogroup" aria-label="Período" className="grid grid-cols-5 gap-1 rounded-2xl bg-surface-muted p-1">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={p.tipo === t.id}
            onClick={() => p.setTipo(t.id)}
            className={clsx(
              "min-h-11 rounded-xl px-2 text-sm font-semibold sm:px-3",
              p.tipo === t.id ? "bg-surface text-brand-800 shadow-soft" : "text-ink-700 hover:text-ink-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {p.tipo === "personalizado" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
            Desde
            <input
              type="date"
              value={p.personalizado.desde}
              max={p.personalizado.hasta || undefined}
              onChange={(e) => p.setPersonalizado({ ...p.personalizado, desde: e.target.value })}
              className="min-h-11 rounded-xl border border-ink-300/70 bg-surface px-3 text-base sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
            Hasta
            <input
              type="date"
              value={p.personalizado.hasta}
              min={p.personalizado.desde || undefined}
              onChange={(e) => p.setPersonalizado({ ...p.personalizado, hasta: e.target.value })}
              className="min-h-11 rounded-xl border border-ink-300/70 bg-surface px-3 text-base sm:text-sm"
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-2xl border border-ink-300/50 bg-surface p-1">
          <button
            type="button"
            onClick={p.anteriorPeriodo}
            aria-label="Período anterior"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 hover:bg-surface-muted"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <p className="flex-1 text-center text-sm font-semibold text-ink-900" aria-live="polite">
            {p.etiqueta}
          </p>
          {!p.esActual && (
            <button type="button" onClick={p.irAHoy} className="min-h-11 rounded-xl px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50">
              Hoy
            </button>
          )}
          <button
            type="button"
            onClick={p.siguientePeriodo}
            aria-label="Período siguiente"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 hover:bg-surface-muted"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
