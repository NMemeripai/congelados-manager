import { useId, useState } from "react";
import Modal from "../ui/Modal";
import Aviso from "../ui/Aviso";
import FormFooter from "./FormFooter";
import { Input, Select, NumberInput } from "../ui/Field";
import * as insumosService from "../../services/insumosService";
import { UNIDADES, UNIDADES_COMPRA, num, hoy, redondear } from "../../lib/costeo";
import { enfocarPrimerError, sinErrores } from "../../lib/validar";

/** insumo: null = nuevo, objeto = editar */
export default function FormInsumo({ open, onClose, insumo }) {
  return (
    <Modal open={open} onClose={onClose} title={insumo ? "Editar insumo" : "Nuevo insumo"}>
      {open && <Contenido onClose={onClose} insumo={insumo} />}
    </Modal>
  );
}

function Contenido({ onClose, insumo }) {
  const formId = useId();
  const [f, setF] = useState({
    nombre: insumo?.nombre || "",
    unidad: insumo?.unidad || "kg",
    costo: insumo ? String(insumo.costo ?? "") : "",
    stock: insumo ? String(insumo.stock ?? 0) : "",
    stockMinimo: insumo?.stockMinimo ? String(insumo.stockMinimo) : "",
    proveedor: insumo?.proveedor || "",
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const u = UNIDADES[f.unidad].label;

  async function guardar(e) {
    e.preventDefault();
    const err = {
      nombre: !f.nombre.trim() ? "Poné el nombre del insumo." : "",
      costo: num(f.costo) <= 0 ? `Poné cuánto te cuesta 1 ${u}.` : "",
      stock: num(f.stock) < 0 ? "El stock no puede ser negativo." : "",
    };
    setErrores(err);
    if (!sinErrores(err)) return enfocarPrimerError();
    setGuardando(true);
    setErrorGeneral("");
    try {
      const data = {
        nombre: f.nombre.trim(),
        unidad: f.unidad,
        costo: num(f.costo),
        stock: redondear(num(f.stock)),
        stockMinimo: num(f.stockMinimo),
        proveedor: f.proveedor.trim(),
      };
      if (!insumo || num(insumo.costo) !== data.costo) data.precioActualizado = hoy();
      if (insumo) await insumosService.actualizar(insumo.id, data);
      else await insumosService.crear(data);
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
        <Input label="Nombre" required value={f.nombre} error={errores.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Harina 000" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Se compra por" value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })}>
            {UNIDADES_COMPRA.map((x) => (
              <option key={x} value={x}>
                {UNIDADES[x].label}
              </option>
            ))}
          </Select>
          <NumberInput label={`Costo por ${u}`} required prefix="$" value={f.costo} error={errores.costo} onChange={(e) => setF({ ...f, costo: e.target.value })} placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label={`Stock actual (${u})`}
            value={f.stock}
            error={errores.stock}
            hint={insumo ? "Corregilo si contaste distinto" : "Lo que tenés hoy"}
            onChange={(e) => setF({ ...f, stock: e.target.value })}
            placeholder="0"
          />
          <NumberInput
            label={`Avisar cuando quede (${u})`}
            value={f.stockMinimo}
            hint="Stock mínimo, opcional"
            onChange={(e) => setF({ ...f, stockMinimo: e.target.value })}
            placeholder="0"
          />
        </div>
        <Input label="Proveedor" hint="Opcional" value={f.proveedor} onChange={(e) => setF({ ...f, proveedor: e.target.value })} />
        {insumo && (
          <Aviso tipo="info">Para sumar mercadería conviene usar <strong>Compra de insumo</strong>: queda registrada y actualiza el costo sola.</Aviso>
        )}
        {errorGeneral && (
          <Aviso tipo="error" role="alert">
            {errorGeneral}
          </Aviso>
        )}
      </form>
      <FormFooter formId={formId} onClose={onClose} guardando={guardando} />
    </>
  );
}
