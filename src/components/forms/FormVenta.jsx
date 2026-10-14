import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import Aviso from "../ui/Aviso";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import FormFooter from "./FormFooter";
import CargaPorVoz from "../CargaPorVoz";
import { Input, Select, NumberInput } from "../ui/Field";
import * as ventasService from "../../services/ventasService";
import { interpretar, METODOS_PAGO } from "../../lib/voz";
import { indexarPorId, totalesVenta, num, pesos, cant, hoy, redondear } from "../../lib/costeo";
import { enfocarPrimerError } from "../../lib/validar";

/** catalogo: productos con .calc (costo y precio de hoy) */
export default function FormVenta({ open, onClose, catalogo, onGuardada }) {
  return (
    <Modal open={open} onClose={onClose} title="Nueva venta" wide>
      {open && <Contenido onClose={onClose} catalogo={catalogo} onGuardada={onGuardada} />}
    </Modal>
  );
}

function Contenido({ onClose, catalogo, onGuardada }) {
  const formId = useId();
  const porId = indexarPorId(catalogo);
  const itemDe = (p) => ({ productoId: p.id, cantidad: "1", precioUnit: String(Math.round(p.calc.precio)) });

  const [fecha, setFecha] = useState(hoy());
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [items, setItems] = useState(catalogo.length ? [itemDe(catalogo[0])] : []);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  if (!catalogo.length) {
    return <Aviso tipo="alerta">Para vender necesitás al menos un producto con su receta (sección Productos).</Aviso>;
  }

  // Cada item guarda el costo de producción de HOY (así la ganancia de meses viejos no cambia).
  const itemsCompletos = items.map((it) => {
    const p = porId[it.productoId];
    return {
      productoId: it.productoId,
      nombre: p?.nombre || "?",
      unidad: p?.unidadVenta || "u",
      cantidad: redondear(num(it.cantidad)),
      precioUnit: num(it.precioUnit),
      costoUnit: redondear(p?.calc.costoUnitario || 0, 2),
    };
  });
  const validos = itemsCompletos.filter((it) => it.cantidad > 0);
  const t = totalesVenta(validos);

  const cambiar = (idx, cambios) => setItems(items.map((it, i) => (i === idx ? { ...it, ...cambios } : it)));

  async function cargarPorVoz(texto) {
    const productos = catalogo.map((p) => ({ id: p.id, nombre: p.nombre, unidadVenta: p.unidadVenta, precio: p.calc.precio }));
    const { datos, aviso } = await interpretar("venta", texto, { productos });
    if (!datos.items.length) return { ok: false, texto: "No reconocí ningún producto. Decí el nombre como está cargado." };
    setItems(
      datos.items.map((it) => ({
        productoId: it.productoId,
        cantidad: String(it.cantidad),
        precioUnit: String(it.precioUnit ?? Math.round(porId[it.productoId].calc.precio)),
      }))
    );
    if (datos.fecha) setFecha(datos.fecha);
    if (datos.cliente) setCliente(datos.cliente);
    if (datos.metodoPago) setMetodoPago(datos.metodoPago);
    setErrores({});
    return { ok: true, texto: (aviso ? aviso + " " : "") + "Revisá los datos y tocá Guardar venta." };
  }

  async function guardar(e) {
    e.preventDefault();
    const err = { fecha: !fecha ? "Poné la fecha." : "" };
    items.forEach((it, i) => {
      if (num(it.cantidad) <= 0) err[`cant${i}`] = "Cantidad mayor a 0.";
      if (num(it.precioUnit) <= 0) err[`precio${i}`] = "Poné el precio.";
    });
    if (metodoPago === "Cuenta corriente" && !cliente.trim()) err.cliente = "Para fiado, poné a quién.";
    setErrores(err);
    if (Object.values(err).some(Boolean)) return enfocarPrimerError();

    setGuardando(true);
    setErrorGeneral("");
    try {
      const data = { fecha, cliente: cliente.trim(), metodoPago, items: validos, ...t };
      if (metodoPago === "Cuenta corriente") data.cobrada = false;
      await ventasService.crear(data);
      onGuardada?.(data);
      onClose();
    } catch (e2) {
      console.error(e2);
      setErrorGeneral("No se pudo guardar la venta. Revisá la conexión y probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <form id={formId} onSubmit={guardar} noValidate className="flex flex-col gap-5">
        <CargaPorVoz
          ejemplo={`vendí 2 kilos de ${catalogo[0]?.nombre.toLowerCase() || "ravioles"} a 9000, pagó con transferencia`}
          onInterpretar={cargarPorVoz}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-ink-900">Productos</legend>
          {items.map((it, idx) => {
            const p = porId[it.productoId];
            const debajoDelCosto = p && num(it.precioUnit) > 0 && num(it.precioUnit) < p.calc.costoUnitario;
            const sinStock = p && num(it.cantidad) > num(p.stock);
            return (
              <div key={idx} className="rounded-2xl border border-ink-300/50 p-3">
                <div className="flex items-end gap-2">
                  <Select
                    fieldClassName="flex-1 min-w-0"
                    label={`Producto ${items.length > 1 ? idx + 1 : ""}`}
                    value={it.productoId}
                    onChange={(e) => cambiar(idx, itemDe(porId[e.target.value]))}
                  >
                    {catalogo.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.unidadVenta})
                      </option>
                    ))}
                  </Select>
                  {items.length > 1 && (
                    <IconButton icon={Trash2} tono="danger" label={`Quitar ${p?.nombre || "producto"}`} onClick={() => setItems(items.filter((_, i) => i !== idx))} />
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <NumberInput
                    label={`Cantidad (${p?.unidadVenta || ""})`}
                    required
                    value={it.cantidad}
                    error={errores[`cant${idx}`]}
                    hint={p ? `Stock: ${cant(p.stock)} ${p.unidadVenta}` : undefined}
                    onChange={(e) => cambiar(idx, { cantidad: e.target.value })}
                  />
                  <NumberInput
                    label={`Precio por ${p?.unidadVenta || "unidad"}`}
                    required
                    prefix="$"
                    value={it.precioUnit}
                    error={errores[`precio${idx}`]}
                    hint={p ? `Costo: ${pesos(p.calc.costoUnitario)}` : undefined}
                    onChange={(e) => cambiar(idx, { precioUnit: e.target.value })}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink-700">
                    Subtotal <strong className="tabular-nums text-ink-900">{pesos(num(it.cantidad) * num(it.precioUnit))}</strong>
                  </span>
                </div>
                {debajoDelCosto && (
                  <p className="mt-2 text-sm font-medium text-red-700">⚠ Ese precio está por debajo del costo: perdés plata en esta venta.</p>
                )}
                {sinStock && !debajoDelCosto && (
                  <p className="mt-2 text-sm text-amber-800">
                    ⚠ Vendés más de lo que hay en stock ({cant(p.stock)} {p.unidadVenta}). ¿Te faltó registrar una producción?
                  </p>
                )}
              </div>
            );
          })}
          <Button variant="outline" icon={Plus} onClick={() => setItems([...items, itemDe(catalogo[0])])} className="self-start">
            Agregar otro producto
          </Button>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-semibold text-ink-900">Datos de la venta</legend>
          <Input label="Fecha" required type="date" value={fecha} error={errores.fecha} onChange={(e) => setFecha(e.target.value)} />
          <Select label="Forma de pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            {METODOS_PAGO.map((m) => (
              <option key={m}>{m === "Cuenta corriente" ? "Cuenta corriente (fiado)" : m}</option>
            ))}
          </Select>
          <Input
            label="Cliente"
            required={metodoPago === "Cuenta corriente"}
            hint={metodoPago === "Cuenta corriente" ? undefined : "Opcional"}
            value={cliente}
            error={errores.cliente}
            onChange={(e) => setCliente(e.target.value)}
            autoComplete="off"
          />
        </fieldset>

        <section aria-label="Totales de la venta" aria-live="polite" className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-subtle p-4">
          <div>
            <div className="text-xs text-ink-500">Total</div>
            <div className="text-lg font-semibold tabular-nums text-ink-900">{pesos(t.total)}</div>
          </div>
          <div>
            <div className="text-xs text-ink-500">Costo</div>
            <div className="text-lg tabular-nums text-ink-700">{pesos(t.costoTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-ink-500">{t.ganancia >= 0 ? "Ganancia" : "Pérdida"}</div>
            <div className={`text-lg font-semibold tabular-nums ${t.ganancia >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {t.ganancia >= 0 ? "+" : "−"}
              {pesos(Math.abs(t.ganancia))}
            </div>
          </div>
        </section>
        {errorGeneral && (
          <Aviso tipo="error" role="alert">
            {errorGeneral}
          </Aviso>
        )}
      </form>
      <FormFooter formId={formId} onClose={onClose} guardando={guardando} label="Guardar venta" />
    </>
  );
}
