import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Abre un formulario cuando la URL trae ?param=1 (lo usa el botón de carga rápida) y limpia la URL. */
export function useAbrirDesdeUrl(param, habilitado = true) {
  const [params, setParams] = useSearchParams();
  const [abierto, setAbierto] = useState(false);
  const pedido = params.get(param) === "1";

  useEffect(() => {
    if (pedido && habilitado) {
      setAbierto(true);
      const p = new URLSearchParams(params);
      p.delete(param);
      setParams(p, { replace: true });
    }
  }, [pedido, habilitado, param, params, setParams]);

  return [abierto, setAbierto];
}
