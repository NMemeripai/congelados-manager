import { useMemo, useState } from "react";
import { Plus, Trash2, ShoppingCart, ChevronDown, CheckCircle2, Clock } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import SelectorPeriodo from "../components/SelectorPeriodo";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import Stat from "../components/ui/Stat";
import FormVenta from "../components/forms/FormVenta";
import { useNegocio } from "../hooks/useNegocio";
import { useAbrirDesdeUrl } from "../hooks/useAbrirDesdeUrl";
import { usePeriodo } from "../context/PeriodoContext";
import * as ventasService from "../services/ventasService";
import { num, pesos, pct, cant, enRango, margen, fechaCorta, porCobrar } from "../lib/costeo";

export default function Ventas() {
  const { ventas, productos, loading } = useNegocio();
  const { rango, etiqueta } = usePeriodo();
  const [abierto, setAbierto] = useAbrirDesdeUrl("nuevo", !loading);
  const [aBorrar, setABorrar] = useState(null);
  const [expandida, setExpandida] = useState(null);
  const [soloFiado, setSoloFiado] = useState(false);

  const delPeriodo = useMemo(
    () =>
      ventas
        .filter((v) => enRango(v.fecha, rango.desde, rango.hasta))
        .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || (b.creadoEn || 0) - (a.creadoEn || 0)),
    [ventas, rango]
  );
  const fiado = porCobrar(ventas);
  const lista = soloFiado ? fiado.lista.sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "")) : delPeriodo;
  const tot = delPeriodo.reduce((t, v) => ({ total: t.total + num(v.total), costo: t.costo + num(v.costoTotal) }), { total: 0, costo: 0 });
  const ganancia = tot.total - tot.costo;

  return (
    <DashboardLayout
      title="Ventas"
      toolbar={
        <Button icon={Plus} onClick={() => setAbierto(true)} disabled={!productos.length} className="w-full sm:w-auto">
          Nueva venta
        </Button>
      }
    >
      <SelectorPeriodo className="mb-4" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Vendido" value={pesos(tot.total)} hint={`${delPeriodo.length} venta(s)`} />
        <Stat label="Costo de lo vendido" value={pesos(tot.costo)} />
        <Stat
          label={ganancia >= 0 ? "Ganancia bruta" : "Pérdida bruta"}
          value={`${ganancia >= 0 ? "+" : "−"}${pesos(Math.abs(ganancia))}`}
          tono={ganancia >= 0 ? "positivo" : "negativo"}
          hint={`Margen ${pct(margen(tot.total, tot.costo))}`}
        />
        <Stat label="Fiado por cobrar" value={pesos(fiado.total)} tono={fiado.total > 0 ? "brand" : "neutral"} hint={`${fiado.lista.length} venta(s), de cualquier fecha`} />
      </div>

      {fiado.lista.length > 0 && (
        <label className="mb-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink-900">
          <input type="checkbox" checked={soloFiado} onChange={(e) => setSoloFiado(e.target.checked)} className="h-5 w-5 accent-brand-600" />
          Ver solo lo fiado sin cobrar
        </label>
      )}

      {loading ? (
        <PageLoader />
      ) : !productos.length ? (
        <EmptyState icon={ShoppingCart} title="Primero creá tus productos">
          Para registrar ventas necesitás al menos un producto con su receta (Inventario → Productos).
        </EmptyState>
      ) : lista.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={soloFiado ? "No hay nada pendiente de cobro" : `No hay ventas en ${etiqueta.toLowerCase()}`}
          action={!soloFiado && <Button icon={Plus} onClick={() => setAbierto(true)}>Registrar una venta</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Lista de ventas">
          {lista.map((v) => {
            const abierta = expandida === v.id;
            const g = num(v.total) - num(v.costoTotal);
            const pendiente = v.metodoPago === "Cuenta corriente" && !v.cobrada;
            return (
              <li key={v.id}>
                <Card className="p-0">
                  <button
                    type="button"
                    onClick={() => setExpandida(abierta ? null : v.id)}
                    aria-expanded={abierta}
                    aria-controls={`venta-${v.id}`}
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-surface-subtle"
                  >
                    <div className="w-11 shrink-0 text-center text-xs font-medium text-ink-500">{fechaCorta(v.fecha)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {(v.items || []).map((it) => `${cant(it.cantidad)} ${it.unidad} ${it.nombre}`).join(", ")}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                        <span>{[v.cliente, v.metodoPago].filter(Boolean).join(" · ") || "—"}</span>
                        {pendiente && <Badge color="warning" icon={Clock}>Por cobrar</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums text-ink-900">{pesos(v.total)}</div>
                      <div className={`text-xs font-medium tabular-nums ${g >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {g >= 0 ? "+" : "−"}
                        {pesos(Math.abs(g))}
                      </div>
                    </div>
                    <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-ink-500 transition ${abierta ? "rotate-180" : ""}`} />
                  </button>
                  {abierta && (
                    <div id={`venta-${v.id}`} className="border-t border-ink-300/40 px-4 py-3 text-sm">
                      <ul className="divide-y divide-ink-300/40">
                        {(v.items || []).map((it, i) => (
                          <li key={i} className="flex justify-between gap-3 py-2">
                            <span className="min-w-0">
                              <span className="font-medium text-ink-900">{it.nombre}</span>
                              <span className="block text-xs text-ink-500">
                                {cant(it.cantidad)} {it.unidad} × {pesos(it.precioUnit)} · costo {pesos(it.costoUnit)}
                              </span>
                            </span>
                            <span className="tabular-nums text-ink-900">{pesos(num(it.cantidad) * num(it.precioUnit))}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-ink-500">Margen de esta venta: {pct(margen(v.total, v.costoTotal))}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {v.metodoPago === "Cuenta corriente" && (
                          <Button variant={v.cobrada ? "outline" : "primary"} icon={CheckCircle2} onClick={() => ventasService.marcarCobrada(v.id, !v.cobrada)}>
                            {v.cobrada ? "Marcar como no cobrada" : "Marcar como cobrada"}
                          </Button>
                        )}
                        <Button variant="ghost" icon={Trash2} onClick={() => setABorrar(v)} className="text-red-700">
                          Eliminar venta
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <FormVenta open={abierto} onClose={() => setAbierto(false)} catalogo={productos} />
      <ConfirmModal open={!!aBorrar} onClose={() => setABorrar(null)} onConfirm={() => ventasService.eliminar(aBorrar)} title="Eliminar venta">
        ¿Eliminar la venta del {aBorrar?.fecha && fechaCorta(aBorrar.fecha)} por <strong>{pesos(aBorrar?.total)}</strong>? Lo vendido vuelve al stock.
      </ConfirmModal>
    </DashboardLayout>
  );
}
