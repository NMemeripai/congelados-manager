// src/services/ventasService.js
// Cada venta descuenta stock de los productos vendidos (y lo devuelve si se borra),
// todo en una sola escritura atómica.
import { listenToCollection, nuevaClave, aplicarCambios, inc, ahora, updateDocById } from "../firebase/database";
import { redondear } from "../lib/costeo";

export const PATH = "ventas";

export const listen = (callback, onError) => listenToCollection(PATH, callback, onError);

export async function crear(venta) {
  const id = nuevaClave(PATH);
  const cambios = { [`${PATH}/${id}`]: { ...venta, creadoEn: ahora(), actualizadoEn: ahora() } };
  for (const it of venta.items || []) {
    if (!it.productoId) continue;
    const key = `productos/${it.productoId}/stock`;
    cambios[key] = inc(redondear((cambios[key]?.__inc || 0) - it.cantidad));
  }
  await aplicarCambios(cambios);
  return id;
}

export async function eliminar(venta) {
  const cambios = { [`${PATH}/${venta.id}`]: null };
  for (const it of venta.items || []) {
    if (!it.productoId) continue;
    const key = `productos/${it.productoId}/stock`;
    cambios[key] = inc(redondear((cambios[key]?.__inc || 0) + it.cantidad));
  }
  await aplicarCambios(cambios);
}

/** Para ventas en cuenta corriente (fiado): marcar que ya se cobró. */
export const marcarCobrada = (id, cobrada = true) => updateDocById(PATH, id, { cobrada });
