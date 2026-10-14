import { useMemo, useState } from "react";
import { PackagePlus, Factory, Trash2, ArrowLeftRight } from "lucide-react";
import clsx from "clsx";
import DashboardLayout from "../components/layout/DashboardLayout";
import InventarioTabs from "../components/InventarioTabs";
import SelectorPeriodo from "../components/SelectorPeriodo";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import FormCompra from "../components/forms/FormCompra";
import FormProduccion from "../components/forms/FormProduccion";
import { useNegocio } from "../hooks/useNegocio";
import { useAbrirDesdeUrl } from "../hooks/useAbrirDesdeUrl";
import { usePeriodo } from "../context/PeriodoContext";
import * as comprasService from "../services/comprasService";
import * as produccionesService from "../services/produccionesService";
import { UNIDADES, enRango, pesos, cant, num, fechaCorta } from "../lib/costeo";

const ordenar = (a, b) => (b.fecha || "").localeCompare(a.fecha || "") || (b.creadoEn || 0) - (a.creadoEn || 0);

export default function Movimientos() {
  const { insumos, productos, compras, producciones, loading } = useNegocio();
  const { rango, etiqueta } = usePeriodo();
  const [vista, setVista] = useState("compras");
  const [compraAbierta, setCompraAbierta] = useAbrirDesdeUrl("compra", !loading);
  const [prodAbierta, setProdAbierta] = useAbrirDesdeUrl("produccion", !loading);
  const [aBorrar, setABorrar] = useState(null);

  const comprasP = useMemo(() => compras.filter((c) => enRango(c.fecha, rango.desde, rango.hasta)).sort(ordenar), [compras, rango]);
  const prodP = useMemo(() => producciones.filter((p) => enRango(p.fecha, rango.desde, rango.hasta)).sort(ordenar), [producciones, rango]);
  const totalCompras = comprasP.reduce((s, c) => s + num(c.total), 0);
  const costoProd = prodP.reduce((s, p) => s + num(p.costoTotal), 0);

  return (
    <DashboardLayout
      title="Movimientos de stock"
      toolbar={
        <>
          <Button icon={PackagePlus} onClick={() => setCompraAbierta(true)} disabled={!insumos.length} className="flex-1 sm:flex-none">
            Compra de insumo
          </Button>
          <Button variant="outline" icon={Factory} onClick={() => setProdAbierta(true)} disabled={!productos.length} className="flex-1 sm:flex-none">
            Producción
          </Button>
        </>
      }
    >
      <InventarioTabs />
      <SelectorPeriodo className="mb-4" />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Compras de insumos</div>
          <div className="text-xl font-semibold tabular-nums text-ink-900">{pesos(totalCompras)}</div>
          <div className="text-xs text-ink-500">{comprasP.length} compra(s)</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Costo de lo producido</div>
          <div className="text-xl font-semibold tabular-nums text-ink-900">{pesos(costoProd)}</div>
          <div className="text-xs text-ink-500">{prodP.length} producción(es)</div>
        </Card>
      </div>

      <div role="tablist" aria-label="Tipo de movimiento" className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1">
        {[
          ["compras", "Compras"],
          ["produccion", "Producción"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={vista === id}
            aria-controls={`panel-${id}`}
            onClick={() => setVista(id)}
            className={clsx("min-h-11 rounded-xl text-sm font-semibold", vista === id ? "bg-surface text-brand-800 shadow-soft" : "text-ink-700")}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : vista === "compras" ? (
        <section id="panel-compras" role="tabpanel" aria-labelledby="tab-compras">
          {comprasP.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title={`Sin compras en ${etiqueta.toLowerCase()}`}>
              Cada compra suma stock al insumo y actualiza su costo.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {comprasP.map((c) => (
                <li key={c.id}>
                  <Card className="flex items-center gap-3 p-3">
                    <div className="w-11 shrink-0 text-center text-xs font-medium text-ink-500">{fechaCorta(c.fecha)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        +{cant(c.cantidad)} {UNIDADES[c.unidad]?.label || c.unidad} de {c.nombre}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {pesos(c.costoUnit)} c/u{c.proveedor ? ` · ${c.proveedor}` : ""}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-ink-900">{pesos(c.total)}</div>
                    <IconButton icon={Trash2} tono="danger" label={`Eliminar compra de ${c.nombre}`} onClick={() => setABorrar({ tipo: "compra", item: c })} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section id="panel-produccion" role="tabpanel" aria-labelledby="tab-produccion">
          {prodP.length === 0 ? (
            <EmptyState icon={Factory} title={`Sin producción en ${etiqueta.toLowerCase()}`}>
              Registrá cada tanda que hagas: suma stock al producto y descuenta los insumos.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {prodP.map((p) => (
                <li key={p.id}>
                  <Card className="flex items-center gap-3 p-3">
                    <div className="w-11 shrink-0 text-center text-xs font-medium text-ink-500">{fechaCorta(p.fecha)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        +{cant(p.cantidad)} {p.unidad} de {p.nombre}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {cant(p.tandas)} tanda(s) · usó {(p.consumos || []).map((c) => `${cant(c.cantidad)} ${c.unidad} ${c.nombre}`).join(", ") || "sin insumos"}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-ink-900">{pesos(p.costoTotal)}</div>
                    <IconButton icon={Trash2} tono="danger" label={`Eliminar producción de ${p.nombre}`} onClick={() => setABorrar({ tipo: "produccion", item: p })} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <FormCompra open={compraAbierta} insumos={insumos} onClose={() => setCompraAbierta(false)} />
      <FormProduccion open={prodAbierta} productos={productos} insumos={insumos} onClose={() => setProdAbierta(false)} />
      <ConfirmModal
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        title={aBorrar?.tipo === "compra" ? "Eliminar compra" : "Eliminar producción"}
        onConfirm={() => (aBorrar.tipo === "compra" ? comprasService.eliminar(aBorrar.item) : produccionesService.eliminar(aBorrar.item))}
      >
        {aBorrar?.tipo === "compra" ? (
          <>
            Se va a restar <strong>{cant(aBorrar.item.cantidad)} {aBorrar.item.unidad}</strong> del stock de {aBorrar.item.nombre}. El costo del insumo no cambia.
          </>
        ) : (
          aBorrar && (
            <>
              Se va a restar <strong>{cant(aBorrar.item.cantidad)} {aBorrar.item.unidad}</strong> del stock de {aBorrar.item.nombre} y se devuelven los insumos que usó.
            </>
          )
        )}
      </ConfirmModal>
    </DashboardLayout>
  );
}
