import { useState } from "react";
import { Plus, Pencil, Trash2, ChefHat, Factory, AlertTriangle } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import InventarioTabs from "../components/InventarioTabs";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import Badge from "../components/ui/Badge";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import FormProducto from "../components/forms/FormProducto";
import FormProduccion from "../components/forms/FormProduccion";
import { useNegocio } from "../hooks/useNegocio";
import * as productosService from "../services/productosService";
import { num, pesos, pct, cant, stockBajo, valorInventario } from "../lib/costeo";

export default function Productos() {
  const { productos, insumos, loading } = useNegocio();
  const [form, setForm] = useState({ open: false, producto: null });
  const [prod, setProd] = useState({ open: false, productoId: null });
  const [aBorrar, setABorrar] = useState(null);
  const valor = valorInventario([], productos).productos;

  return (
    <DashboardLayout
      title="Productos y recetas"
      toolbar={
        <>
          <Button icon={Plus} onClick={() => setForm({ open: true, producto: null })} disabled={!insumos.length} className="flex-1 sm:flex-none">
            Nuevo producto
          </Button>
          <Button variant="outline" icon={Factory} onClick={() => setProd({ open: true, productoId: null })} disabled={!productos.length} className="flex-1 sm:flex-none">
            Registrar producción
          </Button>
        </>
      }
    >
      <InventarioTabs />
      {loading ? (
        <PageLoader />
      ) : insumos.length === 0 ? (
        <EmptyState icon={ChefHat} title="Primero cargá tus insumos">
          Las recetas se arman con los insumos y sus costos. Andá a Insumos y cargá al menos uno.
        </EmptyState>
      ) : productos.length === 0 ? (
        <EmptyState icon={ChefHat} title="Todavía no hay productos" action={<Button icon={Plus} onClick={() => setForm({ open: true, producto: null })}>Crear el primero</Button>}>
          Por ejemplo “Ravioles de verdura”: una tanda rinde 5 kg. Con la receta se calcula el costo real por kg.
        </EmptyState>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Valor de los productos en stock (a costo)</div>
            <div className="text-xl font-semibold tabular-nums text-ink-900">{pesos(valor)}</div>
          </Card>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productos.map((p) => {
              const perdida = p.calc.gananciaUnitaria < 0;
              const debajoObjetivo = p.calc.usaPrecioFijado && p.calc.markup !== null && p.calc.markup < num(p.markupObjetivo);
              const negativo = num(p.stock) < 0;
              return (
                <li key={p.id}>
                  <Card className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-ink-900">{p.nombre}</h2>
                        <p className="text-sm text-ink-500">
                          Tanda: {cant(p.rinde)} {p.unidadVenta}
                        </p>
                      </div>
                      <IconButton icon={Factory} tono="brand" label={`Registrar producción de ${p.nombre}`} onClick={() => setProd({ open: true, productoId: p.id })} />
                      <IconButton icon={Pencil} label={`Editar ${p.nombre}`} onClick={() => setForm({ open: true, producto: p })} />
                      <IconButton icon={Trash2} tono="danger" label={`Eliminar ${p.nombre}`} onClick={() => setABorrar(p)} />
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <Dato label={`Costo / ${p.unidadVenta}`} value={pesos(p.calc.costoUnitario)} />
                      <Dato label={`Precio / ${p.unidadVenta}`} value={pesos(p.calc.precio)} fuerte />
                      <Dato
                        label={perdida ? "Perdés por unidad" : "Ganás por unidad"}
                        value={`${perdida ? "−" : "+"}${pesos(Math.abs(p.calc.gananciaUnitaria))}`}
                        tono={perdida ? "neg" : "pos"}
                      />
                      <Dato label="Margen" value={pct(p.calc.margen)} />
                      <Dato label="En stock" value={`${cant(p.stock)} ${p.unidadVenta}`} tono={negativo || stockBajo(p) ? "neg" : undefined} />
                      <Dato label="Markup" value={pct(p.calc.markup)} />
                    </dl>

                    <div className="flex flex-wrap gap-1.5">
                      {p.calc.usaPrecioFijado ? <Badge color="brand">Precio fijado a mano</Badge> : <Badge>Precio sugerido (+{cant(p.markupObjetivo)}%)</Badge>}
                      {perdida && <Badge color="danger" icon={AlertTriangle}>Se vende por debajo del costo</Badge>}
                      {debajoObjetivo && !perdida && <Badge color="warning">Debajo de tu objetivo de {cant(p.markupObjetivo)}%</Badge>}
                      {negativo && <Badge color="danger" icon={AlertTriangle}>Stock negativo: falta registrar producción</Badge>}
                      {stockBajo(p) && !negativo && <Badge color="danger" icon={AlertTriangle}>Stock bajo</Badge>}
                      {p.calc.tieneFaltantes && <Badge color="danger">Falta un insumo de la receta</Badge>}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <FormProducto open={form.open} producto={form.producto} insumos={insumos} onClose={() => setForm({ open: false, producto: null })} />
      <FormProduccion open={prod.open} productoInicial={prod.productoId} productos={productos} insumos={insumos} onClose={() => setProd({ open: false, productoId: null })} />
      <ConfirmModal open={!!aBorrar} onClose={() => setABorrar(null)} onConfirm={() => productosService.eliminar(aBorrar.id)} title="Eliminar producto">
        ¿Eliminar <strong>{aBorrar?.nombre}</strong>? Las ventas ya registradas no se modifican.
      </ConfirmModal>
    </DashboardLayout>
  );
}

function Dato({ label, value, fuerte, tono }) {
  const color = tono === "pos" ? "text-emerald-700 font-semibold" : tono === "neg" ? "text-red-700 font-semibold" : fuerte ? "font-semibold text-ink-900" : "text-ink-900";
  return (
    <div className="rounded-xl bg-surface-subtle px-3 py-2">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className={`tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}
