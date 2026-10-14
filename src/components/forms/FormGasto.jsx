import { useId, useState } from "react";
import Modal from "../ui/Modal";
import Aviso from "../ui/Aviso";
import FormFooter from "./FormFooter";
import CargaPorVoz from "../CargaPorVoz";
import { Input, Select, NumberInput } from "../ui/Field";
import * as gastosService from "../../services/gastosService";
import { interpretar, CATEGORIAS_GASTO } from "../../lib/voz";
import { num, hoy } from "../../lib/costeo";
import { enfocarPrimerError, sinErrores } from "../../lib/validar";

/** gasto: null = nuevo, objeto = editar */
export default function FormGasto({ open, onClose, gasto, fechaSugerida }) {
  return (
    <Modal open={open} onClose={onClose} title={gasto ? "Editar gasto" : "Nuevo gasto"}>
      {open && <Contenido onClose={onClose} gasto={gasto} fechaSugerida={fechaSugerida} />}
    </Modal>
  );
}

function Contenido({ onClose, gasto, fechaSugerida }) {
  const formId = useId();
  const [f, setF] = useState(
    gasto
      ? { fecha: gasto.fecha, categoria: gasto.categoria, descripcion: gasto.descripcion || "", monto: String(gasto.monto) }
      : { fecha: fechaSugerida || hoy(), categoria: CATEGORIAS_GASTO[0], descripcion: "", monto: "" }
  );
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  async function guardar(e) {
    e.preventDefault();
    const err = {
      monto: num(f.monto) <= 0 ? "Poné el monto (mayor a 0)." : "",
      fecha: !f.fecha ? "Poné la fecha." : "",
    };
    setErrores(err);
    if (!sinErrores(err)) return enfocarPrimerError();
    setGuardando(true);
    setErrorGeneral("");
    try {
      const data = { fecha: f.fecha, categoria: f.categoria, descripcion: f.descripcion.trim(), monto: num(f.monto) };
      if (gasto) await gastosService.actualizar(gasto.id, data);
      else await gastosService.crear(data);
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
        {!gasto && (
          <CargaPorVoz
            ejemplo="pagué la luz 45 mil"
            onInterpretar={async (texto) => {
              const { datos, aviso } = await interpretar("gasto", texto);
              if (!datos.monto) return { ok: false, texto: "No escuché el monto. Probá diciendo el número." };
              setF((x) => ({ ...x, fecha: datos.fecha || x.fecha, monto: String(datos.monto), categoria: datos.categoria, descripcion: datos.descripcion }));
              setErrores({});
              return { ok: true, texto: (aviso ? aviso + " " : "") + "Revisá y tocá Guardar." };
            }}
          />
        )}
        <Aviso tipo="info">
          Acá van los gastos que <strong>no</strong> están en las recetas (alquiler, luz, sueldos, impuestos…). La harina, huevos y demás insumos se
          cargan como <strong>compra de insumo</strong>, no como gasto.
        </Aviso>
        <NumberInput label="Monto" required prefix="$" value={f.monto} error={errores.monto} onChange={(e) => setF({ ...f, monto: e.target.value })} placeholder="0" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Categoría" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Input label="Fecha" required type="date" value={f.fecha} error={errores.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
        </div>
        <Input label="Detalle" hint="Opcional. Ej: alquiler del local" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        {errorGeneral && (
          <Aviso tipo="error" role="alert">
            {errorGeneral}
          </Aviso>
        )}
      </form>
      <FormFooter formId={formId} onClose={onClose} guardando={guardando} label="Guardar gasto" />
    </>
  );
}
