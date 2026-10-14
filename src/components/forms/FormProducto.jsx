import { useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import Aviso from "../ui/Aviso";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import FormFooter from "./FormFooter";
import { Input, Select, NumberInput } from "../ui/Field";
import * as productosService from "../../services/productosService";
import { UNIDADES_VENTA, unidadesCompatibles, costearProducto, indexarPorId, num, pesos, pct, cant, redondear } from "../../lib/costeo";
import { enfocarPrimerError, sinErrores } from "../../lib/validar";

/** producto: null = nuevo, objeto = editar */
export default function FormProducto({ open, onClose, producto, insumos }) {
  return (
    <Modal open={open} onClose={onClose} title={producto ? "Editar producto" : "Nuevo producto"} wide>
      {open && <Contenido onClose={onClose} producto={producto} insumos={insumos} />}
    </Modal>
  );
}

function Contenido({ onClose, producto, insumos }) {
  const formId = useId();
  const insumosPorId = useMemo(() => indexarPorId(insumos), [insumos]);
  const ordenados = [...insumos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const [f, setF] = useState({
    nombre: producto?.nombre || "",
    unidadVenta: producto?.unidadVenta || "kg",
    rinde: producto ? String(producto.rinde ?? "") : "",
    ingredientes: (producto?.ingredientes || []).map((i) => ({ ...i, cantidad: String(i.cantidad) })),
    costosExtra: producto?.costosExtra ? String(producto.costosExtra) : "",
    markupObjetivo: String(producto?.markupObjetivo ?? 40),
    precioVenta: producto?.precioVenta ? String(producto.precioVenta) : "",
    stock: producto ? String(producto.stock ?? 0) : "",
    stockMinimo: producto?.stockMinimo ? String(producto.stockMinimo) : "",
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const calc = costearProducto(f, insumosPorId);
  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.value });
  const u = f.unidadVenta;

  function agregarIngrediente() {
    const usados = new Set(f.ingredientes.map((i) => i.insumoId));
    const libre = ordenados.find((i) => !usados.has(i.id)) || ordenados[0];
    setF({ ...f, ingredientes: [...f.ingredientes, { insumoId: libre.id, cantidad: "", unidad: libre.unidad }] });
  }
  const cambiarIng = (idx, cambios) => setF({ ...f, ingredientes: f.ingredientes.map((ing, i) => (i === idx ? { ...ing, ...cambios } : ing)) });

  async function guardar(e) {
    e.preventDefault();
    const err = {
      nombre: !f.nombre.trim() ? "Poné el nombre del producto." : "",
      rinde: num(f.rinde) <= 0 ? `Poné cuánto rinde una tanda (en ${u}).` : "",
      ingredientes: f.ingredientes.filter((i) => num(i.cantidad) > 0).length === 0 ? "Agregá al menos un insumo con su cantidad." : "",
    };
    setErrores(err);
    if (!sinErrores(err)) return enfocarPrimerError();
    setGuardando(true);
    setErrorGeneral("");
    try {
      const data = {
        nombre: f.nombre.trim(),
        unidadVenta: f.unidadVenta,
        rinde: num(f.rinde),
        ingredientes: f.ingredientes.filter((i) => num(i.cantidad) > 0).map((i) => ({ insumoId: i.insumoId, cantidad: num(i.cantidad), unidad: i.unidad })),
        costosExtra: num(f.costosExtra),
        markupObjetivo: num(f.markupObjetivo),
        precioVenta: num(f.precioVenta),
        stock: redondear(num(f.stock)),
        stockMinimo: num(f.stockMinimo),
      };
      if (producto) await productosService.actualizar(producto.id, data);
      else await productosService.crear(data);
      onClose();
    } catch (e2) {
      console.error(e2);
      setErrorGeneral("No se pudo guardar. Revisá la conexión y probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (!insumos.length) return <Aviso tipo="alerta">Primero cargá tus insumos: la receta se arma con ellos.</Aviso>;

  return (
    <>
      <form id={formId} onSubmit={guardar} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-semibold text-ink-900">Producto</legend>
            <Input label="Nombre" required value={f.nombre} error={errores.nombre} onChange={set("nombre")} placeholder="Ravioles de verdura" />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="Una tanda rinde" required value={f.rinde} error={errores.rinde} onChange={set("rinde")} placeholder="5" />
              <Select label="Se vende por" value={f.unidadVenta} onChange={set("unidadVenta")}>
                {UNIDADES_VENTA.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </div>
          </fieldset>

          <fieldset aria-describedby={errores.ingredientes ? `${formId}-ing-err` : undefined}>
            <legend className="mb-2 text-sm font-semibold text-ink-900">
              Receta de una tanda <span className="text-red-700" aria-hidden="true">*</span>
            </legend>
            {f.ingredientes.length === 0 && <p className="mb-2 rounded-xl bg-surface-subtle p-3 text-sm text-ink-500">Agregá los insumos que lleva una tanda.</p>}
            <ul className="flex flex-col gap-2">
              {f.ingredientes.map((ing, idx) => {
                const insumo = insumosPorId[ing.insumoId];
                return (
                  <li key={idx} className="rounded-2xl border border-ink-300/50 p-3">
                    <div className="flex items-end gap-2">
                      <Select
                        fieldClassName="min-w-0 flex-1"
                        label={`Insumo ${idx + 1}`}
                        value={ing.insumoId}
                        onChange={(e) => {
                          const nuevo = insumosPorId[e.target.value];
                          cambiarIng(idx, { insumoId: nuevo.id, unidad: nuevo.unidad });
                        }}
                      >
                        {!insumo && <option value={ing.insumoId}>(insumo borrado)</option>}
                        {ordenados.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre}
                          </option>
                        ))}
                      </Select>
                      <IconButton icon={Trash2} tono="danger" label={`Quitar ${insumo?.nombre || "insumo"}`} onClick={() => setF({ ...f, ingredientes: f.ingredientes.filter((_, i) => i !== idx) })} />
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_96px] gap-2">
                      <NumberInput label="Cantidad" value={ing.cantidad} onChange={(e) => cambiarIng(idx, { cantidad: e.target.value })} placeholder="0" />
                      <Select label="Unidad" value={ing.unidad} onChange={(e) => cambiarIng(idx, { unidad: e.target.value })}>
                        {unidadesCompatibles(insumo?.unidad || ing.unidad).map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <p className="mt-1 text-right text-xs tabular-nums text-ink-500">Costo: {pesos(calc.ingredientes[idx]?.costo || 0)}</p>
                  </li>
                );
              })}
            </ul>
            {errores.ingredientes && (
              <p id={`${formId}-ing-err`} className="mt-2 text-xs font-medium text-red-700">
                {errores.ingredientes}
              </p>
            )}
            <Button variant="outline" icon={Plus} onClick={agregarIngrediente} className="mt-2" aria-invalid={errores.ingredientes ? true : undefined}>
              Agregar insumo
            </Button>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-semibold text-ink-900">Precio</legend>
            <NumberInput label="Otros costos por tanda" prefix="$" hint="Gas, luz, packaging, mano de obra…" value={f.costosExtra} onChange={set("costosExtra")} placeholder="0" />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="% de ganancia sobre el costo" suffix="%" value={f.markupObjetivo} onChange={set("markupObjetivo")} />
              <NumberInput
                label={`Precio por ${u}`}
                prefix="$"
                hint="Vacío = usa el sugerido"
                value={f.precioVenta}
                onChange={set("precioVenta")}
                placeholder={calc.precioSugerido ? String(Math.round(calc.precioSugerido)) : ""}
              />
            </div>
          </fieldset>

          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="mb-2 text-sm font-semibold text-ink-900">Stock</legend>
            <NumberInput label={`Stock actual (${u})`} hint={producto ? "Corregilo si contaste distinto" : "Lo que tenés hoy"} value={f.stock} onChange={set("stock")} placeholder="0" />
            <NumberInput label={`Avisar cuando quede (${u})`} hint="Opcional" value={f.stockMinimo} onChange={set("stockMinimo")} placeholder="0" />
          </fieldset>
        </div>

        <aside aria-label="Cálculo del costo" className="flex flex-col gap-2 self-start rounded-2xl bg-surface-subtle p-4 text-sm lg:sticky lg:top-0" aria-live="polite">
          <h3 className="mb-1 font-semibold text-ink-900">Cálculo</h3>
          <Linea label="Insumos" value={pesos(calc.costoIngredientes)} />
          <Linea label="Otros costos" value={pesos(calc.costosExtra)} />
          <Linea label="Costo de la tanda" value={pesos(calc.costoTanda)} fuerte />
          <hr className="border-ink-300/50" />
          <Linea label={`Costo por ${u}`} value={pesos(calc.costoUnitario)} fuerte />
          <Linea label={`Sugerido (+${cant(f.markupObjetivo)}%)`} value={pesos(calc.precioSugerido)} />
          <Linea label={`Precio por ${u}`} value={pesos(calc.precio)} fuerte />
          <Linea label={calc.gananciaUnitaria >= 0 ? "Ganás por unidad" : "Perdés por unidad"} value={pesos(Math.abs(calc.gananciaUnitaria))} tono={calc.gananciaUnitaria >= 0 ? "pos" : "neg"} />
          <hr className="border-ink-300/50" />
          <Linea label="Markup (sobre costo)" value={pct(calc.markup)} />
          <Linea label="Margen (sobre precio)" value={pct(calc.margen)} />
          <p className="mt-1 text-xs leading-relaxed text-ink-500">Markup es cuánto le sumás al costo. Margen es qué parte de lo que cobrás es ganancia. 40% de markup = 28,6% de margen.</p>
        </aside>
        {errorGeneral && (
          <Aviso tipo="error" role="alert" className="lg:col-span-2">
            {errorGeneral}
          </Aviso>
        )}
      </form>
      <FormFooter formId={formId} onClose={onClose} guardando={guardando} />
    </>
  );
}

function Linea({ label, value, fuerte, tono }) {
  const color = tono === "pos" ? "text-emerald-700 font-semibold" : tono === "neg" ? "text-red-700 font-semibold" : fuerte ? "font-semibold text-ink-900" : "text-ink-700";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink-700">{label}</span>
      <span className={`tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
