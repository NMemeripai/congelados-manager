import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import SelectorPeriodo from "../components/SelectorPeriodo";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import FormGasto from "../components/forms/FormGasto";
import { useNegocio } from "../hooks/useNegocio";
import { useAbrirDesdeUrl } from "../hooks/useAbrirDesdeUrl";
import { usePeriodo } from "../context/PeriodoContext";
import * as gastosService from "../services/gastosService";
import { gastosCategoriaRango, enRango, num, pesos, pct, fechaCorta, hoy } from "../lib/costeo";

export default function Gastos() {
  const { gastos, ventas, loading } = useNegocio();
  const { rango, etiqueta, esActual } = usePeriodo();
  const [nuevo, setNuevo] = useAbrirDesdeUrl("nuevo", !loading);
  const [editar, setEditar] = useState(null);
  const [aBorrar, setABorrar] = useState(null);

  const delPeriodo = useMemo(
    () => gastos.filter((g) => enRango(g.fecha, rango.desde, rango.hasta)).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")),
    [gastos, rango]
  );
  const porCategoria = useMemo(() => gastosCategoriaRango(gastos, rango.desde, rango.hasta), [gastos, rango]);
  const total = delPeriodo.reduce((s, g) => s + num(g.monto), 0);
  const ingresos = ventas.filter((v) => enRango(v.fecha, rango.desde, rango.hasta)).reduce((s, v) => s + num(v.total), 0);

  return (
    <DashboardLayout
      title="Gastos"
      toolbar={
        <Button icon={Plus} onClick={() => setNuevo(true)} className="w-full sm:w-auto">
          Nuevo gasto
        </Button>
      }
    >
      <SelectorPeriodo className="mb-4" />

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="self-start p-4 lg:order-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">Total de gastos</h2>
            <p className="text-2xl font-semibold tabular-nums text-ink-900">{pesos(total)}</p>
            {ingresos > 0 && <p className="text-sm text-ink-500">Equivale al {pct((total / ingresos) * 100)} de lo vendido</p>}
            {porCategoria.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3">
                {porCategoria.map((c) => (
                  <li key={c.categoria}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <span className="text-ink-700">{c.categoria}</span>
                      <span className="tabular-nums text-ink-900">
                        {pesos(c.monto)} <span className="text-ink-500">({pct((c.monto / total) * 100)})</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted" aria-hidden="true">
                      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(c.monto / total) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="min-w-0 lg:order-1">
            {delPeriodo.length === 0 ? (
              <EmptyState icon={Receipt} title={`No hay gastos en ${etiqueta.toLowerCase()}`} action={<Button icon={Plus} onClick={() => setNuevo(true)}>Cargar un gasto</Button>}>
                Alquiler, luz, gas, sueldos, impuestos… Los insumos se cargan como compra, no acá.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {delPeriodo.map((g) => (
                  <li key={g.id}>
                    <Card className="flex items-center gap-2 p-3">
                      <div className="w-11 shrink-0 text-center text-xs font-medium text-ink-500">{fechaCorta(g.fecha)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink-900">{g.descripcion || g.categoria}</div>
                        <div className="text-xs text-ink-500">{g.categoria}</div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-ink-900">{pesos(g.monto)}</div>
                      <IconButton icon={Pencil} label={`Editar gasto ${g.descripcion || g.categoria}`} onClick={() => setEditar(g)} />
                      <IconButton icon={Trash2} tono="danger" label={`Eliminar gasto ${g.descripcion || g.categoria}`} onClick={() => setABorrar(g)} />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <FormGasto open={nuevo} onClose={() => setNuevo(false)} fechaSugerida={esActual ? hoy() : rango.desde} />
      <FormGasto open={!!editar} gasto={editar} onClose={() => setEditar(null)} />
      <ConfirmModal open={!!aBorrar} onClose={() => setABorrar(null)} onConfirm={() => gastosService.eliminar(aBorrar.id)} title="Eliminar gasto">
        ¿Eliminar el gasto de <strong>{pesos(aBorrar?.monto)}</strong> ({aBorrar?.categoria})?
      </ConfirmModal>
    </DashboardLayout>
  );
}
