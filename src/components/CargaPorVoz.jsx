import { useId, useState } from "react";
import { Mic, Square, Sparkles, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { useDictado } from "../hooks/useDictado";

/**
 * Carga por voz (o escribiendo la frase). Interpreta y completa el formulario; nunca guarda solo.
 * onInterpretar(texto) devuelve { ok, texto } para mostrar el resultado.
 */
export default function CargaPorVoz({ ejemplo, onInterpretar }) {
  const id = useId();
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [escrito, setEscrito] = useState("");

  async function procesar(texto) {
    if (!texto.trim()) return;
    setProcesando(true);
    setResultado(null);
    try {
      const r = await onInterpretar(texto.trim());
      setResultado({ ...r, oido: texto.trim() });
      setEscrito("");
    } catch (e) {
      console.error(e);
      setResultado({ ok: false, texto: "No pude interpretar eso. Cargalo a mano.", oido: texto.trim() });
    } finally {
      setProcesando(false);
    }
  }

  const { soportado, escuchando, parcial, error, iniciar, detener } = useDictado({ onFinal: procesar });

  return (
    <section aria-labelledby={`${id}-t`} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
      <div className="flex items-center gap-3">
        {soportado && (
          <button
            type="button"
            onClick={escuchando ? detener : iniciar}
            disabled={procesando}
            aria-label={escuchando ? "Dejar de escuchar" : "Dictar por voz"}
            aria-pressed={escuchando}
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-pop transition disabled:opacity-60",
              escuchando ? "animate-pulse bg-red-600" : "bg-brand-600 hover:bg-brand-700"
            )}
          >
            {escuchando ? <Square size={18} fill="currentColor" aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
          </button>
        )}
        <div className="min-w-0 flex-1 text-sm" aria-live="polite">
          {procesando ? (
            <span className="flex items-center gap-1.5 font-semibold text-brand-800">
              <Sparkles size={16} aria-hidden="true" className="animate-spin" /> Interpretando…
            </span>
          ) : escuchando ? (
            <span className="text-ink-900">{parcial || "Te escucho…"}</span>
          ) : (
            <>
              <h3 id={`${id}-t`} className="font-semibold text-ink-900">
                {soportado ? "Dictala por voz" : "Escribila como la dirías"}
              </h3>
              <p className="text-xs text-ink-700">Ej: “{ejemplo}”</p>
            </>
          )}
        </div>
      </div>

      {!escuchando && !procesando && (
        <div className="mt-2 flex gap-2">
          <label htmlFor={`${id}-txt`} className="sr-only">
            Escribí la frase para completar el formulario
          </label>
          <input
            id={`${id}-txt`}
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                procesar(escrito);
              }
            }}
            placeholder={soportado ? "…o escribila acá" : ejemplo}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink-300/70 bg-surface px-3 text-base outline-none focus:border-brand-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() => procesar(escrito)}
            disabled={!escrito.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand-700 hover:bg-brand-100 disabled:opacity-40"
            aria-label="Completar con esta frase"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {resultado && (
        <p role="status" className={clsx("mt-2 flex gap-1.5 text-xs font-medium", resultado.ok ? "text-emerald-800" : "text-amber-800")}>
          {resultado.ok ? <CheckCircle2 size={14} aria-hidden="true" className="mt-px shrink-0" /> : <AlertTriangle size={14} aria-hidden="true" className="mt-px shrink-0" />}
          <span>
            {resultado.texto} <span className="font-normal text-ink-700">(“{resultado.oido}”)</span>
          </span>
        </p>
      )}
    </section>
  );
}
