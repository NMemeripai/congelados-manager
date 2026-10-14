import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wheat, Search } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import { useInsumos, useProductos } from "../hooks/useColeccion";
import * as insumosService from "../services/insumosService";
import { UNIDADES, UNIDADES_COMPRA, num, pesos, hoy } from "../lib/costeo";

const VACIO = { nombre: "", unidad: "kg", costo: "", proveedor: "" };

export default function Insumos() {
  const { data: insumos, loading } = useInsumos();
  const { data: productos } = useProductos();
  const [form, setForm] = useState(null); // null = cerrado
  const [editId, setEditId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const lista = useMemo(
    () =>
      [...insumos]
        .filter((i) => i.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [insumos, busqueda]
  );

  // Cuántas recetas usan cada insumo (para avisar antes de borrar).
  const usos = useMemo(() => {
    const map = {};
    for (const p of productos) for (const ing of p.ingredientes || []) map[ing.insumoId] = (map[ing.insumoId] || 0) + 1;
    return map;
  }, [productos]);

  function abrirNuevo() {
    setEditId(null);
    setForm(VACIO);
  }
  function abrirEditar(i) {
    setEditId(i.id);
    setForm({ nombre: i.nombre, unidad: i.unidad, costo: String(i.costo ?? ""), proveedor: i.proveedor || "" });
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre.trim(),
        unidad: form.unidad,
        costo: num(form.costo),
        proveedor: form.proveedor.trim(),
        precioActualizado: hoy(),
      };
      if (editId) await insumosService.actualizar(editId, data);
      else await insumosService.crear(data);
      setForm(null);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <DashboardLayout
      title="Insumos"
      actions={
        <Button icon={Plus} onClick={abrirNuevo}>
          Nuevo insumo
        </Button>
      }
    >
      <p className="mb-4 text-sm text-ink-500">
        Cargá lo que comprás para producir y cuánto te cuesta. Cuando cambie un precio, actualizalo acá y el costo de
        todas tus recetas se recalcula solo.
      </p>

      {loading ? (
        <PageLoader />
      ) : insumos.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="Todavía no cargaste insumos"
          action={<Button icon={Plus} onClick={abrirNuevo}>Cargar el primero</Button>}
        >
          Por ejemplo: harina 000 a $X el kg, huevos a $X la docena, ricota a $X el kg.
        </EmptyState>
      ) : (
        <Card className="p-0">
          <div className="border-b border-ink-300/30 p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-ink-500" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar insumo…"
                className="w-full rounded-xl bg-surface-subtle py-2.5 pl-9 pr-3 text-sm outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-ink-300/30">
            {lista.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">{i.nombre}</div>
                  <div className="text-xs text-ink-500">
                    {i.proveedor ? `${i.proveedor} · ` : ""}
                    actualizado {i.precioActualizado || "—"}
                    {usos[i.id] ? ` · en ${usos[i.id]} receta${usos[i.id] > 1 ? "s" : ""}` : ""}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-ink-900">
                  {pesos(i.costo)}
                  <span className="font-normal text-ink-500"> / {UNIDADES[i.unidad]?.label || i.unidad}</span>
                </div>
                <button onClick={() => abrirEditar(i)} className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted">
                  <Pencil size={16} />
                </button>
                <button onClick={() => setABorrar(i)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={editId ? "Editar insumo" : "Nuevo insumo"}>
        {form && (
          <form onSubmit={guardar} className="flex flex-col gap-4">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Harina 000"
              required
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Se compra por" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
                {UNIDADES_COMPRA.map((u) => (
                  <option key={u} value={u}>
                    {UNIDADES[u].label}
                  </option>
                ))}
              </Select>
              <Input
                label={`Costo por ${UNIDADES[form.unidad].label}`}
                inputMode="decimal"
                value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <Input
              label="Proveedor (opcional)"
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
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

      <ConfirmModal
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        onConfirm={() => insumosService.eliminar(aBorrar.id)}
        title="Eliminar insumo"
      >
        ¿Eliminar <b>{aBorrar?.nombre}</b>?
        {usos[aBorrar?.id] > 0 && (
          <span className="mt-2 block text-amber-700">
            Ojo: lo usan {usos[aBorrar.id]} receta(s). Van a quedar con un ingrediente faltante y el costo les va a dar
            más bajo de lo real.
          </span>
        )}
      </ConfirmModal>
    </DashboardLayout>
  );
}
