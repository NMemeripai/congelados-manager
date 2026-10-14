import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wheat, Search, PackagePlus, AlertTriangle } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import InventarioTabs from "../components/InventarioTabs";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import Badge from "../components/ui/Badge";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import FormInsumo from "../components/forms/FormInsumo";
import FormCompra from "../components/forms/FormCompra";
import { useNegocio } from "../hooks/useNegocio";
import * as insumosService from "../services/insumosService";
import { UNIDADES, pesos, cant, num, stockBajo, fechaLarga, valorInventario, parseFecha, hoy } from "../lib/costeo";

const diasDesde = (f) => (f ? Math.round((parseFecha(hoy()) - parseFecha(f)) / 86400000) : null);

export default function Insumos() {
  const { insumos, productos, loading } = useNegocio();
  const [form, setForm] = useState({ open: false, insumo: null });
  const [compra, setCompra] = useState({ open: false, insumoId: null });
  const [aBorrar, setABorrar] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const lista = useMemo(
    () => [...insumos].filter((i) => (i.nombre || "").toLowerCase().includes(busqueda.toLowerCase())).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [insumos, busqueda]
  );
  const usos = useMemo(() => {
    const map = {};
    for (const p of productos) for (const ing of p.ingredientes || []) map[ing.insumoId] = (map[ing.insumoId] || 0) + 1;
    return map;
  }, [productos]);
  const valor = valorInventario(insumos, []).insumos;
  const bajos = insumos.filter(stockBajo).length;

  return (
    <DashboardLayout
      title="Insumos"
      toolbar={
        <>
          <Button icon={Plus} onClick={() => setForm({ open: true, insumo: null })} className="flex-1 sm:flex-none">
            Nuevo insumo
          </Button>
          <Button variant="outline" icon={PackagePlus} onClick={() => setCompra({ open: true, insumoId: null })} disabled={!insumos.length} className="flex-1 sm:flex-none">
            Registrar compra
          </Button>
        </>
      }
    >
      <InventarioTabs />
      {loading ? (
        <PageLoader />
      ) : insumos.length === 0 ? (
        <EmptyState icon={Wheat} title="Todavía no cargaste insumos" action={<Button icon={Plus} onClick={() => setForm({ open: true, insumo: null })}>Cargar el primero</Button>}>
          Lo que comprás para producir y cuánto te cuesta: harina $X el kg, huevos $X la docena, ricota $X el kg.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Valor en insumos</div>
              <div className="text-xl font-semibold tabular-nums text-ink-900">{pesos(valor)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Stock bajo</div>
              <div className={`text-xl font-semibold tabular-nums ${bajos ? "text-red-700" : "text-ink-900"}`}>
                {bajos} {bajos === 1 ? "insumo" : "insumos"}
              </div>
            </Card>
          </div>

          <div className="relative mb-3">
            <label htmlFor="buscar-insumo" className="sr-only">
              Buscar insumo
            </label>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              id="buscar-insumo"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar insumo…"
              className="min-h-11 w-full rounded-xl border border-ink-300/70 bg-surface pl-10 pr-3 text-base sm:text-sm"
            />
          </div>

          <ul className="grid gap-3 lg:grid-cols-2">
            {lista.map((i) => {
              const bajo = stockBajo(i);
              const negativo = num(i.stock) < 0;
              const viejo = diasDesde(i.precioActualizado) > 30;
              const u = UNIDADES[i.unidad]?.label || i.unidad;
              return (
                <li key={i.id}>
                  <Card className="p-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-semibold text-ink-900">{i.nombre}</h2>
                        <p className="text-sm text-ink-500">
                          {pesos(i.costo)} / {u}
                          {i.proveedor ? ` · ${i.proveedor}` : ""}
                        </p>
                      </div>
                      <IconButton icon={PackagePlus} tono="brand" label={`Registrar compra de ${i.nombre}`} onClick={() => setCompra({ open: true, insumoId: i.id })} />
                      <IconButton icon={Pencil} label={`Editar ${i.nombre}`} onClick={() => setForm({ open: true, insumo: i })} />
                      <IconButton icon={Trash2} tono="danger" label={`Eliminar ${i.nombre}`} onClick={() => setABorrar(i)} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <div className="text-xs text-ink-500">En stock</div>
                        <div className={`text-lg font-semibold tabular-nums ${negativo || bajo ? "text-red-700" : "text-ink-900"}`}>
                          {cant(i.stock)} {u}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {negativo && <Badge color="danger" icon={AlertTriangle}>Stock negativo</Badge>}
                        {bajo && !negativo && <Badge color="danger" icon={AlertTriangle}>Stock bajo (mín. {cant(i.stockMinimo)})</Badge>}
                        {viejo && <Badge color="warning">Precio de hace {diasDesde(i.precioActualizado)} días</Badge>}
                        {usos[i.id] > 0 && <Badge>En {usos[i.id]} receta{usos[i.id] > 1 ? "s" : ""}</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">Precio actualizado: {fechaLarga(i.precioActualizado)}</p>
                  </Card>
                </li>
              );
            })}
          </ul>
          {lista.length === 0 && <p className="py-8 text-center text-sm text-ink-500">No hay insumos que coincidan con “{busqueda}”.</p>}
        </>
      )}

      <FormInsumo open={form.open} insumo={form.insumo} onClose={() => setForm({ open: false, insumo: null })} />
      <FormCompra open={compra.open} insumoInicial={compra.insumoId} insumos={insumos} onClose={() => setCompra({ open: false, insumoId: null })} />
      <ConfirmModal open={!!aBorrar} onClose={() => setABorrar(null)} onConfirm={() => insumosService.eliminar(aBorrar.id)} title="Eliminar insumo">
        ¿Eliminar <strong>{aBorrar?.nombre}</strong>?
        {usos[aBorrar?.id] > 0 && (
          <span className="mt-2 block font-medium text-amber-800">
            Lo usan {usos[aBorrar.id]} receta(s): van a quedar con un insumo faltante y el costo les va a dar más bajo de lo real.
          </span>
        )}
      </ConfirmModal>
    </DashboardLayout>
  );
}
