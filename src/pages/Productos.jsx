import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ChefHat, X, AlertTriangle } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import { useInsumos, useProductos } from "../hooks/useColeccion";
import * as productosService from "../services/productosService";
import {
  UNIDADES_VENTA,
  unidadesCompatibles,
  costearProducto,
  indexarPorId,
  num,
  pesos,
  pct,
  cant,
} from "../lib/costeo";

const VACIO = {
  nombre: "",
  unidadVenta: "kg",
  rinde: "",
  ingredientes: [],
  costosExtra: "",
  markupObjetivo: "40",
  precioVenta: "",
};

export default function Productos() {
  const { data: productos, loading } = useProductos();
  const { data: insumos, loading: loadingInsumos } = useInsumos();
  const insumosPorId = useMemo(() => indexarPorId(insumos), [insumos]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);

  const lista = useMemo(
    () =>
      [...productos]
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((p) => ({ ...p, calc: costearProducto(p, insumosPorId) })),
    [productos, insumosPorId]
  );

  function abrirNuevo() {
    setEditId(null);
    setForm(VACIO);
  }
  function abrirEditar(p) {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      unidadVenta: p.unidadVenta || "kg",
      rinde: String(p.rinde ?? ""),
      ingredientes: (p.ingredientes || []).map((i) => ({ ...i, cantidad: String(i.cantidad) })),
      costosExtra: p.costosExtra ? String(p.costosExtra) : "",
      markupObjetivo: String(p.markupObjetivo ?? 40),
      precioVenta: p.precioVenta ? String(p.precioVenta) : "",
    });
  }

  return (
    <DashboardLayout
      title="Productos y recetas"
      actions={
        <Button icon={Plus} onClick={abrirNuevo} disabled={insumos.length === 0}>
          Nuevo producto
        </Button>
      }
    >
      <p className="mb-4 text-sm text-ink-500">
        Cada producto tiene su receta: qué insumos lleva una tanda y cuánto rinde. Con eso se calcula el costo real
        por kilo (o por unidad) y el precio sugerido según tu porcentaje de ganancia.
      </p>

      {loading || loadingInsumos ? (
        <PageLoader />
      ) : insumos.length === 0 ? (
        <EmptyState icon={ChefHat} title="Primero cargá tus insumos">
          Las recetas se arman con los insumos y sus costos. Andá a la sección Insumos y cargá al menos uno.
        </EmptyState>
      ) : lista.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Todavía no hay productos"
          action={<Button icon={Plus} onClick={abrirNuevo}>Crear el primero</Button>}
        >
          Por ejemplo: "Ravioles de verdura", una tanda rinde 5 kg.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink-900">{p.nombre}</div>
                  <div className="text-xs text-ink-500">
                    Tanda rinde {cant(p.rinde)} {p.unidadVenta}
                  </div>
                </div>
                <div className="flex">
                  <button onClick={() => abrirEditar(p)} className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setABorrar(p)}
                    className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <Dato label={`Costo / ${p.unidadVenta}`} value={pesos(p.calc.costoUnitario)} />
                <Dato label={`Precio / ${p.unidadVenta}`} value={pesos(p.calc.precio)} fuerte />
                <Dato label="Ganancia" value={pesos(p.calc.gananciaUnitaria)} />
                <Dato label="Markup / margen" value={`${pct(p.calc.markup)} / ${pct(p.calc.margen)}`} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.calc.usaPrecioFijado ? (
                  <Badge color="brand">Precio fijado a mano</Badge>
                ) : (
                  <Badge>Precio sugerido (+{cant(p.markupObjetivo)}%)</Badge>
                )}
                {p.calc.usaPrecioFijado && p.calc.markup !== null && p.calc.markup < num(p.markupObjetivo) && (
                  <Badge color="warning">Debajo de tu objetivo de {cant(p.markupObjetivo)}%</Badge>
                )}
                {p.calc.tieneFaltantes && <Badge color="danger">Falta un insumo</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={editId ? "Editar producto" : "Nuevo producto"} wide>
        {form && (
          <FormProducto
            form={form}
            setForm={setForm}
            insumos={insumos}
            insumosPorId={insumosPorId}
            onCancel={() => setForm(null)}
            onSave={async (data) => {
              if (editId) await productosService.actualizar(editId, data);
              else await productosService.crear(data);
              setForm(null);
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        onConfirm={() => productosService.eliminar(aBorrar.id)}
        title="Eliminar producto"
      >
        ¿Eliminar <b>{aBorrar?.nombre}</b>? Las ventas ya registradas no se modifican.
      </ConfirmModal>
    </DashboardLayout>
  );
}

function Dato({ label, value, fuerte }) {
  return (
    <div className="rounded-xl bg-surface-subtle px-3 py-2">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className={`tabular-nums ${fuerte ? "font-semibold text-ink-900" : "text-ink-700"}`}>{value}</div>
    </div>
  );
}

function FormProducto({ form, setForm, insumos, insumosPorId, onCancel, onSave }) {
  const [guardando, setGuardando] = useState(false);
  const calc = costearProducto(form, insumosPorId);
  const insumosOrdenados = [...insumos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function agregarIngrediente() {
    const usados = new Set(form.ingredientes.map((i) => i.insumoId));
    const libre = insumosOrdenados.find((i) => !usados.has(i.id)) || insumosOrdenados[0];
    setForm({
      ...form,
      ingredientes: [...form.ingredientes, { insumoId: libre.id, cantidad: "", unidad: libre.unidad }],
    });
  }
  function cambiarIngrediente(idx, cambios) {
    const ingredientes = form.ingredientes.map((ing, i) => (i === idx ? { ...ing, ...cambios } : ing));
    setForm({ ...form, ingredientes });
  }
  function quitarIngrediente(idx) {
    setForm({ ...form, ingredientes: form.ingredientes.filter((_, i) => i !== idx) });
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await onSave({
        nombre: form.nombre.trim(),
        unidadVenta: form.unidadVenta,
        rinde: num(form.rinde),
        ingredientes: form.ingredientes
          .filter((i) => num(i.cantidad) > 0)
          .map((i) => ({ insumoId: i.insumoId, cantidad: num(i.cantidad), unidad: i.unidad })),
        costosExtra: num(form.costosExtra),
        markupObjetivo: num(form.markupObjetivo),
        precioVenta: num(form.precioVenta),
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={form.nombre} onChange={set("nombre")} placeholder="Ravioles de verdura" required autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Una tanda rinde"
            inputMode="decimal"
            value={form.rinde}
            onChange={set("rinde")}
            placeholder="5"
            required
          />
          <Select label="Se vende por" value={form.unidadVenta} onChange={set("unidadVenta")}>
            {UNIDADES_VENTA.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">Ingredientes de una tanda</span>
            <Button type="button" variant="ghost" icon={Plus} onClick={agregarIngrediente} className="px-2 py-1.5">
              Agregar
            </Button>
          </div>
          {form.ingredientes.length === 0 && (
            <p className="rounded-xl bg-surface-subtle p-3 text-sm text-ink-500">Agregá los insumos que lleva la receta.</p>
          )}
          <div className="flex flex-col gap-2">
            {form.ingredientes.map((ing, idx) => {
              const insumo = insumosPorId[ing.insumoId];
              const costo = calc.ingredientes[idx]?.costo || 0;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={ing.insumoId}
                    onChange={(e) => {
                      const nuevo = insumosPorId[e.target.value];
                      cambiarIngrediente(idx, { insumoId: nuevo.id, unidad: nuevo.unidad });
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-ink-300/50 bg-surface px-2 py-2 text-sm"
                  >
                    {!insumo && <option value={ing.insumoId}>(insumo borrado)</option>}
                    {insumosOrdenados.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    inputMode="decimal"
                    value={ing.cantidad}
                    onChange={(e) => cambiarIngrediente(idx, { cantidad: e.target.value })}
                    placeholder="0"
                    className="w-20 rounded-xl border border-ink-300/50 px-2 py-2 text-right text-sm"
                  />
                  <select
                    value={ing.unidad}
                    onChange={(e) => cambiarIngrediente(idx, { unidad: e.target.value })}
                    className="w-20 rounded-xl border border-ink-300/50 bg-surface px-1 py-2 text-sm"
                  >
                    {unidadesCompatibles(insumo?.unidad || ing.unidad).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <span className="hidden w-20 text-right text-xs tabular-nums text-ink-500 sm:block">{pesos(costo)}</span>
                  <button type="button" onClick={() => quitarIngrediente(idx)} className="rounded-lg p-1.5 text-ink-500 hover:bg-surface-muted">
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <Input
          label="Otros costos por tanda (gas, luz, packaging, mano de obra…)"
          inputMode="decimal"
          value={form.costosExtra}
          onChange={set("costosExtra")}
          placeholder="0"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="% de ganancia sobre el costo"
            inputMode="decimal"
            value={form.markupObjetivo}
            onChange={set("markupObjetivo")}
            placeholder="40"
          />
          <Input
            label="Precio de venta (opcional)"
            inputMode="decimal"
            value={form.precioVenta}
            onChange={set("precioVenta")}
            placeholder={calc.precioSugerido ? String(Math.round(calc.precioSugerido)) : "Usa el sugerido"}
          />
        </div>
        <p className="-mt-2 text-xs text-ink-500">
          Si dejás el precio vacío, se usa el sugerido y se actualiza solo cuando suben los insumos.
        </p>
      </div>

      {/* Panel de cálculo en vivo */}
      <div className="flex flex-col gap-2 self-start rounded-2xl bg-surface-subtle p-4 text-sm lg:sticky lg:top-0">
        <div className="mb-1 font-semibold text-ink-900">Cálculo</div>
        <Linea label="Ingredientes" value={pesos(calc.costoIngredientes)} />
        <Linea label="Otros costos" value={pesos(calc.costosExtra)} />
        <Linea label="Costo de la tanda" value={pesos(calc.costoTanda)} fuerte />
        <hr className="border-ink-300/40" />
        <Linea label={`Costo por ${form.unidadVenta}`} value={pesos(calc.costoUnitario)} fuerte />
        <Linea label={`Sugerido (+${cant(form.markupObjetivo)}%)`} value={pesos(calc.precioSugerido)} />
        <Linea label={`Precio por ${form.unidadVenta}`} value={pesos(calc.precio)} fuerte />
        <Linea label="Ganancia por unidad" value={pesos(calc.gananciaUnitaria)} />
        <hr className="border-ink-300/40" />
        <Linea label="Markup (sobre costo)" value={pct(calc.markup)} />
        <Linea label="Margen (sobre precio)" value={pct(calc.margen)} />
        <p className="mt-1 text-xs leading-relaxed text-ink-500">
          Markup es cuánto le sumás al costo. Margen es qué parte de lo que cobrás es ganancia. Un 40% de markup da un
          28,6% de margen.
        </p>
        {num(form.rinde) <= 0 && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle size={14} /> Poné cuánto rinde la tanda para calcular el costo por {form.unidadVenta}.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={guardando} className="flex-1">
            Guardar
          </Button>
        </div>
      </div>
    </form>
  );
}

function Linea({ label, value, fuerte }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink-500">{label}</span>
      <span className={`tabular-nums ${fuerte ? "font-semibold text-ink-900" : "text-ink-700"}`}>{value}</span>
    </div>
  );
}

