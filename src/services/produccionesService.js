// src/services/produccionesService.js
// Producción: suma stock al producto y descuenta de cada insumo lo que usa la receta.
import { listenToCollection, nuevaClave, aplicarCambios, inc, ahora } from "../firebase/database";
import { redondear } from "../lib/costeo";

export const PATH = "producciones";

export const listen = (callback, onError) => listenToCollection(PATH, callback, onError);

/** prod = { fecha, productoId, nombre, unidad, tandas, cantidad, costoUnit, costoTotal, consumos:[{insumoId, nombre, unidad, cantidad}] } */
export async function crear(prod) {
  const id = nuevaClave(PATH);
  const cambios = {
    [`${PATH}/${id}`]: { ...prod, creadoEn: ahora(), actualizadoEn: ahora() },
    [`productos/${prod.productoId}/stock`]: inc(redondear(prod.cantidad)),
  };
  for (const c of prod.consumos || []) {
    const key = `insumos/${c.insumoId}/stock`;
    cambios[key] = inc(redondear((cambios[key]?.__inc || 0) - c.cantidad));
  }
  await aplicarCambios(cambios);
  return id;
}

/** Deshace la producción: saca el stock del producto y devuelve los insumos. */
export async function eliminar(prod) {
  const cambios = {
    [`${PATH}/${prod.id}`]: null,
    [`productos/${prod.productoId}/stock`]: inc(-redondear(prod.cantidad)),
  };
  for (const c of prod.consumos || []) {
    const key = `insumos/${c.insumoId}/stock`;
    cambios[key] = inc(redondear((cambios[key]?.__inc || 0) + c.cantidad));
  }
  await aplicarCambios(cambios);
}
