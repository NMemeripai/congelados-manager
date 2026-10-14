import { useState } from "react";
import { Mic, Square, Sparkles, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { useDictado } from "../hooks/useDictado";

/**
 * Bloque de carga por voz. Dictás (o escribís) la frase, se interpreta y se llama a onInterpretar(texto).
 * onInterpretar debe devolver un mensaje de resultado { ok, texto } para mostrar.
 */
export default function CargaPorVoz({ ejemplo, onInterpretar }) {
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
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
      <div className="flex items-center gap-3">
        {soportado && (
          <button
            type="button"
            onClick={escuchando ? detener : iniciar}
            disabled={procesando}
            aria-label={escuchando ? "Dejar de escuchar" : "Dictar"}
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-pop transition disabled:opacity-60",
              escuchando ? "animate-pulse bg-red-600" : "bg-brand-600 hover:bg-brand-700"
            )}
          >
            {escuchando ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
          </button>
        )}
        <div className="min-w-0 flex-1 text-sm">
          {procesando ? (
            <span className="flex items-center gap-1.5 font-medium text-brand-700">
              <Sparkles size={15} className="animate-spin" /> Interpretando…
            </span>
          ) : escuchando ? (
            <span className="text-ink-900">{parcial || "Te escucho…"}</span>
          ) : (
            <>
              <div className="font-medium text-ink-900">{soportado ? "Dictala por voz" : "Escribila como la dirías"}</div>
              <div className="truncate text-xs text-ink-500">Ej: “{ejemplo}”</div>
            </>
          )}
        </div>
      </div>

      {!escuchando && !procesando && (
        <div className="mt-2 flex gap-2">
          <input
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                procesar(escrito);
              }
            }}
            placeholder={soportado ? "…o escribila acá" : ejemplo}
            className="min-w-0 flex-1 rounded-xl border border-ink-300/50 bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={() => procesar(escrito)}
            disabled={!escrito.trim()}
            className="rounded-xl bg-surface px-3 text-brand-700 hover:bg-brand-100 disabled:opacity-40"
            aria-label="Interpretar"
          >
            <Send size={16} />
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {resultado && (
        <div className={clsx("mt-2 flex gap-1.5 text-xs", resultado.ok ? "text-emerald-700" : "text-amber-700")}>
          {resultado.ok ? <CheckCircle2 size={14} className="mt-px shrink-0" /> : <AlertTriangle size={14} className="mt-px shrink-0" />}
          <span>
            {resultado.texto} <span className="text-ink-500">(“{resultado.oido}”)</span>
          </span>
        </div>
      )}
    </div>
  );
}
