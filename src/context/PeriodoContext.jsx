import { createContext, useContext, useMemo, useState } from "react";
import { hoy } from "../lib/costeo";
import { rangoDe, mover, rangoAnterior, etiquetaRango } from "../lib/periodos";

const PeriodoContext = createContext(null);

function leer() {
  try {
    return JSON.parse(sessionStorage.getItem("periodo") || "null");
  } catch {
    return null;
  }
}

/** Período elegido, compartido entre Resumen, Ventas y Gastos (se recuerda mientras la pestaña esté abierta). */
export function PeriodoProvider({ children }) {
  const inicial = leer();
  const [tipo, setTipoState] = useState(inicial?.tipo || "mes");
  const [ref, setRef] = useState(hoy());
  const [personalizado, setPersonalizado] = useState(inicial?.personalizado || { desde: "", hasta: "" });

  const valor = useMemo(() => {
    const rango = rangoDe(tipo, ref, personalizado);
    const guardar = (t, p) => {
      try {
        sessionStorage.setItem("periodo", JSON.stringify({ tipo: t, personalizado: p }));
      } catch {
        /* sin storage: no pasa nada */
      }
    };
    return {
      tipo,
      ref,
      rango,
      anterior: rangoAnterior(tipo, ref, rango),
      etiqueta: etiquetaRango(tipo, ref, rango),
      personalizado,
      setTipo: (t) => {
        setTipoState(t);
        setRef(hoy());
        if (t === "personalizado" && !personalizado.desde) {
          const r = rangoDe("mes", hoy());
          setPersonalizado(r);
          guardar(t, r);
        } else guardar(t, personalizado);
      },
      setPersonalizado: (p) => {
        setPersonalizado(p);
        guardar(tipo, p);
      },
      anteriorPeriodo: () => setRef((r) => mover(tipo, r, -1)),
      siguientePeriodo: () => setRef((r) => mover(tipo, r, +1)),
      irAHoy: () => setRef(hoy()),
      esActual: rango.desde <= hoy() && hoy() <= rango.hasta,
    };
  }, [tipo, ref, personalizado]);

  return <PeriodoContext.Provider value={valor}>{children}</PeriodoContext.Provider>;
}

export function usePeriodo() {
  const ctx = useContext(PeriodoContext);
  if (!ctx) throw new Error("usePeriodo debe usarse dentro de PeriodoProvider");
  return ctx;
}
