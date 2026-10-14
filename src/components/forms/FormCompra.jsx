import { useId, useState } from "react";
import Modal from "../ui/Modal";
import FormFooter from "./FormFooter";
import Aviso from "../ui/Aviso";
import { Input, NumberInput, Select } from "../ui/Field";
import * as comprasService from "../../services/comprasService";
import { UNIDADES, num, pesos, hoy, cant, redondear } from "../../lib/costeo";
import { enfocarPrimerError, sinErrores } from "../../lib/validar";

/** Compra de insumos: suma stock y (opcional) actualiza el costo del insumo. */
export default function FormCompra({ open, onClose, insumos, insumoInicial }) {
  return (
    <Modal open={open} onClose={onClose} title="Compra de insumo" description="Suma al stock y actualiza el costo.">
      {open && <Contenido onClose={onClose} insumos={insumos} insumoInicial={insumoInicial} />}
    </Modal>
  );
}

function Contenido({ onClose, insumos, insumoInicial }) {
  const formId = useId();
  const ordenados = [...insumos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const inicial = insumos.find((i) => i.id === insumoInicial) || ordenados[0];
  const [f, setF] = useState({
    insumoId: inicial?.id || "",
    fecha: hoy(),
    cantidad: "",
    costoUnit: inicial ? String(inicial.costo ?? "") : "",
    proveedor: inicial?.proveedor || "",
    actualizarCosto: true,
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const insumo = insumos.find((i) => i.id === f.insumoId);
  const unidad = UNIDADES[insumo?.unidad]?.label || insumo?.unidad || "";
  const total = num(f.cantidad) * num(f.costoUnit);
  const cambioPrecio = insumo && num(f.costoUnit) > 0 && num(insumo.costo) > 0 ? ((num(f.costoUnit) - num(insumo.costo)) / num(insumo.costo)) * 100 : 0;

  if (!insumos.length) {
    return <Aviso tipo="alerta">Primero cargá tus insumos en la sección Insumos.</Aviso>;
  }

  async function guardar(e) {
    e.preventDefault();
    const err = {
      insumoId: !insumo ? "Elegí un insumo." : "",
      fecha: !f.fecha ? "Poné la fecha." : "",
      cantidad: num(f.cantidad) <= 0 ? "La cantidad tiene que ser mayor a 0." : "",
      costoUnit: num(f.costoUnit) <= 0 ? "Poné cuánto pagaste por unidad." : "",
    };
    setErrores(err);
    if (!sinErrores(err)) return enfocarPrimerError();
    setGuardando(true);
    setErrorGeneral("");
    try {
      await comprasService.crear({
        fecha: f.fecha,
        insumoId: insumo.id,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        cantidad: redondear(num(f.cantidad)),
        costoUnit: num(f.costoUnit),
        proveedor: f.proveedor.trim(),
        actualizarCosto: f.actualizarCosto,
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
        <Select
          label="Insumo"
          required
          value={f.insumoId}
          error={errores.insumoId}
          onChange={(e) => {
            const i = insumos.find((x) => x.id === e.target.value);
            setF({ ...f, insumoId: e.target.value, costoUnit: String(i?.costo ?? ""), proveedor: i?.proveedor || f.proveedor });
          }}
        >
          {ordenados.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} (stock: {cant(i.stock)} {UNIDADES[i.unidad]?.label || i.unidad})
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label={`Cantidad (${unidad})`} required value={f.cantidad} error={errores.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} placeholder="0" />
          <NumberInput label={`Precio por ${unidad}`} required prefix="$" value={f.costoUnit} error={errores.costoUnit} onChange={(e) => setF({ ...f, costoUnit: e.target.value })} placeholder="0" />
        </div>
        <Input label="Fecha" required type="date" value={f.fecha} error={errores.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
        <Input label="Proveedor" hint="Opcional" value={f.proveedor} onChange={(e) => setF({ ...f, proveedor: e.target.value })} autoComplete="organization" />

        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-ink-300/50 p-3 text-sm">
          <input type="checkbox" checked={f.actualizarCosto} onChange={(e) => setF({ ...f, actualizarCosto: e.target.checked })} className="mt-0.5 h-5 w-5 accent-brand-600" />
          <span>
            <span className="font-medium text-ink-900">Actualizar el costo del insumo a este precio</span>
            <span className="block text-ink-500">Así tus recetas calculan con el precio nuevo.</span>
          </span>
        </label>

        <div className="rounded-2xl bg-surface-subtle p-4" aria-live="polite">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-700">Total de la compra</span>
            <span className="text-xl font-semibold tabular-nums text-ink-900">{pesos(total)}</span>
          </div>
          {Math.abs(cambioPrecio) >= 1 && (
            <p className={`mt-1 text-sm font-medium ${cambioPrecio > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {cambioPrecio > 0 ? "▲ Subió" : "▼ Bajó"} {Math.abs(cambioPrecio).toFixed(1).replace(".", ",")}% respecto del costo cargado ({pesos(insumo.costo)})
            </p>
          )}
        </div>
        {errorGeneral && <Aviso tipo="error" role="alert">{errorGeneral}</Aviso>}
      </form>
      <FormFooter formId={formId} onClose={onClose} guardando={guardando} label="Guardar compra" />
    </>
  );
}
