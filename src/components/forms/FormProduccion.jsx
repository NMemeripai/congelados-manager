import { useId, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Aviso from "../ui/Aviso";
import FormFooter from "./FormFooter";
import { Input, NumberInput, Select } from "../ui/Field";
import * as produccionesService from "../../services/produccionesService";
import { UNIDADES, costearProducto, consumosProduccion, indexarPorId, num, pesos, hoy, cant, redondear } from "../../lib/costeo";
import { enfocarPrimerError, sinErrores } from "../../lib/validar";

/** Registrar producción: suma stock al producto y descuenta los insumos de la receta. */
export default function FormProduccion({ open, onClose, productos, insumos, productoInicial }) {
  return (
    <Modal open={open} onClose={onClose} title="Registrar producción" description="Suma stock al producto y descuenta insumos.">
      {open && <Contenido onClose={onClose} productos={productos} insumos={insumos} productoInicial={productoInicial} />}
    </Modal>
  );
}

function Contenido({ onClose, productos, insumos, productoInicial }) {
  const formId = useId();
  const insumosPorId = useMemo(() => indexarPorId(insumos), [insumos]);
  const ordenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const [f, setF] = useState({
    productoId: productos.find((p) => p.id === productoInicial)?.id || ordenados[0]?.id || "",
    tandas: "1",
    fecha: hoy(),
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const producto = productos.find((p) => p.id === f.productoId);
  const calc = producto ? costearProducto(producto, insumosPorId) : null;
  const tandas = num(f.tandas);
  const cantidad = redondear(num(producto?.rinde) * tandas);
  const consumos = producto ? consumosProduccion(producto, insumosPorId, tandas) : [];
  const faltantes = consumos.filter((c) => c.cantidad > c.disponible);

  if (!productos.length) {
    return <Aviso tipo="alerta">Primero creá un producto con su receta en la sección Productos.</Aviso>;
  }

  async function guardar(e) {
    e.preventDefault();
    const err = {
      productoId: !producto ? "Elegí un producto." : "",
      tandas: tandas <= 0 ? "Poné cuántas tandas hiciste (puede ser 0,5)." : "",
      fecha: !f.fecha ? "Poné la fecha." : "",
    };
    setErrores(err);
    if (!sinErrores(err)) return enfocarPrimerError();
    setGuardando(true);
    setErrorGeneral("");
    try {
      await produccionesService.crear({
        fecha: f.fecha,
        productoId: producto.id,
        nombre: producto.nombre,
        unidad: producto.unidadVenta,
        tandas,
        cantidad,
        costoUnit: redondear(calc.costoUnitario, 2),
        costoTotal: redondear(calc.costoTanda * tandas, 2),
        consumos: consumos.map(({ insumoId, nombre, unidad, cantidad: c }) => ({ insumoId, nombre, unidad, cantidad: c })),
      });
      onClose();
    } catch (e2) {
      console.error(e2);
      setErrorGeneral("No se pudo guardar. Revisá la conexión y probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <form id={formId} onSubmit={guardar} noValidate className="flex flex-col gap-4">
        <Select label="Producto" required value={f.productoId} error={errores.productoId} onChange={(e) => setF({ ...f, productoId: e.target.value })}>
          {ordenados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} (tanda = {cant(p.rinde)} {p.unidadVenta})
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Tandas" required value={f.tandas} error={errores.tandas} onChange={(e) => setF({ ...f, tandas: e.target.value })} />
          <Input label="Fecha" required type="date" value={f.fecha} error={errores.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
        </div>

        <section aria-labelledby={`${formId}-res`} className="rounded-2xl bg-surface-subtle p-4" aria-live="polite">
          <h3 id={`${formId}-res`} className="sr-only">
            Resultado de la producción
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-ink-500">Vas a sumar</div>
              <div className="text-xl font-semibold tabular-nums text-ink-900">
                {cant(cantidad)} {producto?.unidadVenta}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-500">Costo de producirlo</div>
              <div className="text-xl font-semibold tabular-nums text-ink-900">{pesos((calc?.costoTanda || 0) * tandas)}</div>
            </div>
          </div>
          {consumos.length > 0 && (
            <>
              <h4 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-500">Se descuenta del stock</h4>
              <ul className="divide-y divide-ink-300/40 text-sm">
                {consumos.map((c) => {
                  const falta = c.cantidad > c.disponible;
                  return (
                    <li key={c.insumoId} className="flex items-center justify-between gap-2 py-2">
                      <span className="min-w-0 text-ink-900">{c.nombre}</span>
                      <span className={`text-right tabular-nums ${falta ? "font-semibold text-red-700" : "text-ink-700"}`}>
                        {cant(c.cantidad)} {UNIDADES[c.unidad]?.label || c.unidad}
                        <span className="block text-xs font-normal text-ink-500">hay {cant(c.disponible)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {producto && consumos.length === 0 && <p className="mt-3 text-sm text-ink-500">Este producto no tiene receta cargada: no se descuentan insumos.</p>}
        </section>

        {faltantes.length > 0 && (
          <Aviso tipo="alerta" titulo="No alcanza el stock de algunos insumos">
            {faltantes.map((c) => c.nombre).join(", ")}. Podés guardar igual (el stock queda en negativo) y después registrar la compra.
          </Aviso>
        )}
        {errorGeneral && (
          <Aviso tipo="error" role="alert">
            {errorGeneral}
          </Aviso>
        )}
      </form>
      <FormFooter formId={formId} onClose={onClose} guardando={guardando} label="Guardar producción" />
    </>
  );
}
