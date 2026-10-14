import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Receipt, Info } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import SelectorMes from "../components/SelectorMes";
import CargaPorVoz from "../components/CargaPorVoz";
import { interpretar, CATEGORIAS_GASTO } from "../lib/voz";
import { useGastos } from "../hooks/useColeccion";
import * as gastosService from "../services/gastosService";
import { gastosPorCategoria, num, pesos, hoy, mesDe } from "../lib/costeo";

const VACIO = { fecha: hoy(), categoria: CATEGORIAS_GASTO[0], descripcion: "", monto: "" };

export default function Gastos() {
  const { data: gastos, loading } = useGastos();
  const [mes, setMes] = useState(mesDe(hoy()));
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const delMes = useMemo(
    () => gastos.filter((g) => mesDe(g.fecha) === mes).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")),
    [gastos, mes]
  );
  const porCategoria = useMemo(() => gastosPorCategoria(gastos, mes), [gastos, mes]);
  const total = delMes.reduce((s, g) => s + num(g.monto), 0);

  function abrirNuevo() {
    setEditId(null);
    // Si estás mirando otro mes, el gasto nuevo se propone en ese mes.
    setForm({ ...VACIO, fecha: mes === mesDe(hoy()) ? hoy() : `${mes}-01` });
  }
  function abrirEditar(g) {
    setEditId(g.id);
    setForm({ fecha: g.fecha, categoria: g.categoria, descripcion: g.descripcion || "", monto: String(g.monto) });
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = { fecha: form.fecha, categoria: form.categoria, descripcion: form.descripcion.trim(), monto: num(form.monto) };
      if (editId) await gastosService.actualizar(editId, data);
      else await gastosService.crear(data);
      setMes(mesDe(form.fecha));
      setForm(null);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <DashboardLayout
      title="Gastos"
      actions={
        <>
          <SelectorMes mes={mes} onChange={setMes} />
          <Button icon={Plus} onClick={abrirNuevo}>
            Nuevo gasto
          </Button>
        </>
      }
    >
      <div className="mb-4 flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
        <Info size={18} className="mt-0.5 shrink-0" />
        <span>
          Acá van los gastos que <b>no</b> están en las recetas: alquiler, sueldos, impuestos, etc. La compra de harina,
          huevos y demás insumos <b>no</b> se carga acá, porque ya se descuenta como costo de cada venta. Si la cargás en
          los dos lados, la ganancia te va a dar menos de lo real.
        </span>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div>
            {delMes.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No hay gastos este mes"
                action={<Button icon={Plus} onClick={abrirNuevo}>Cargar un gasto</Button>}
              />
            ) : (
              <Card className="divide-y divide-ink-300/30 p-0">
                {delMes.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-12 shrink-0 text-xs text-ink-500">{g.fecha?.slice(8, 10)}/{g.fecha?.slice(5, 7)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-900">{g.descripcion || g.categoria}</div>
                      <div className="text-xs text-ink-500">{g.categoria}</div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-ink-900">{pesos(g.monto)}</div>
                    <button onClick={() => abrirEditar(g)} className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setABorrar(g)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </div>

          <Card className="self-start">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Total del mes</div>
            <div className="mb-4 text-2xl font-semibold tabular-nums text-ink-900">{pesos(total)}</div>
            <div className="flex flex-col gap-2.5">
              {porCategoria.map((c) => (
                <div key={c.categoria}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-700">{c.categoria}</span>
                    <span className="tabular-nums text-ink-900">{pesos(c.monto)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-muted">
                    <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(c.monto / total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={editId ? "Editar gasto" : "Nuevo gasto"}>
        {form && (
          <form onSubmit={guardar} className="flex flex-col gap-4">
            {!editId && (
              <CargaPorVoz
                ejemplo="pagué la luz 45 mil"
                onInterpretar={async (texto) => {
                  const { datos, aviso } = await interpretar("gasto", texto);
                  if (!datos.monto) return { ok: false, texto: "No escuché el monto. Probá diciendo el número." };
                  setForm((f) => ({
                    ...f,
                    fecha: datos.fecha || f.fecha,
                    monto: String(datos.monto),
                    categoria: datos.categoria,
                    descripcion: datos.descripcion,
                  }));
                  return { ok: true, texto: (aviso ? aviso + " " : "") + "Revisá y tocá Guardar." };
                }}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
              <Input
                label="Monto"
                inputMode="decimal"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                placeholder="0"
                required
                autoFocus
              />
            </div>
            <Select label="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Input
              label="Detalle (opcional)"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Alquiler del local"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={guardando}>
                Guardar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal open={!!aBorrar} onClose={() => setABorrar(null)} onConfirm={() => gastosService.eliminar(aBorrar.id)} title="Eliminar gasto">
        ¿Eliminar el gasto de <b>{pesos(aBorrar?.monto)}</b> ({aBorrar?.categoria})?
      </ConfirmModal>
    </DashboardLayout>
  );
}
