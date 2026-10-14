// src/services/comprasService.js
// Compra de insumos: suma stock al insumo y actualiza su costo al precio pagado.
// No es un gasto operativo: el insumo pasa al inventario y se vuelve costo cuando se vende el producto.
import { listenToCollection, nuevaClave, aplicarCambios, inc, ahora } from "../firebase/database";
import { redondear } from "../lib/costeo";

export const PATH = "compras";

export const listen = (callback, onError) => listenToCollection(PATH, callback, onError);

/** compra = { fecha, insumoId, nombre, unidad, cantidad, costoUnit, proveedor, actualizarCosto } */
export async function crear({ actualizarCosto = true, ...compra }) {
  const id = nuevaClave(PATH);
  const total = redondear(compra.cantidad * compra.costoUnit, 2);
  const cambios = {
    [`${PATH}/${id}`]: { ...compra, total, creadoEn: ahora(), actualizadoEn: ahora() },
    [`insumos/${compra.insumoId}/stock`]: inc(redondear(compra.cantidad)),
  };
  if (actualizarCosto) {
    cambios[`insumos/${compra.insumoId}/costo`] = compra.costoUnit;
    cambios[`insumos/${compra.insumoId}/precioActualizado`] = compra.fecha;
  }
  await aplicarCambios(cambios);
  return id;
}

/** Borra la compra y saca del stock lo que había sumado (el costo del insumo no se toca). */
export async function eliminar(compra) {
  await aplicarCambios({
    [`${PATH}/${compra.id}`]: null,
    [`insumos/${compra.insumoId}/stock`]: inc(-redondear(compra.cantidad)),
  });
}
