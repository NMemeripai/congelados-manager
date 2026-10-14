import { useMemo } from "react";
import { useColeccion } from "./useColeccion";
import { costearProducto, indexarPorId } from "../lib/costeo";

/** Todos los datos del negocio, con cada producto ya costeado con los precios de hoy. */
export function useNegocio() {
  const insumos = useColeccion("insumos");
  const productos = useColeccion("productos");
  const ventas = useColeccion("ventas");
  const gastos = useColeccion("gastos");
  const compras = useColeccion("compras");
  const producciones = useColeccion("producciones");

  const insumosPorId = useMemo(() => indexarPorId(insumos.data), [insumos.data]);
  const catalogo = useMemo(
    () =>
      [...productos.data]
        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
        .map((p) => ({ ...p, calc: costearProducto(p, insumosPorId) })),
    [productos.data, insumosPorId]
  );

  const todos = [insumos, productos, ventas, gastos, compras, producciones];
  return {
    insumos: insumos.data,
    insumosPorId,
    productos: catalogo,
    ventas: ventas.data,
    gastos: gastos.data,
    compras: compras.data,
    producciones: producciones.data,
    loading: todos.some((x) => x.loading),
    error: todos.find((x) => x.error)?.error || null,
  };
}
