import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Wallet, Receipt, PiggyBank } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import PageLoader from "../components/ui/PageLoader";
import SelectorMes from "../components/SelectorMes";
import { useGastos, useVentas } from "../hooks/useColeccion";
import {
  resumenPorMes,
  resumenDeMes,
  productosDelMes,
  ultimosMeses,
  nombreMes,
  pesos,
  pct,
  cant,
  hoy,
  mesDe,
} from "../lib/costeo";

const compacto = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

export default function Resumen() {
  const { data: ventas, loading: l1 } = useVentas();
  const { data: gastos, loading: l2 } = useGastos();
  const [mes, setMes] = useState(mesDe(hoy()));

  const resumen = useMemo(() => resumenPorMes(ventas, gastos), [ventas, gastos]);
  const actual = resumenDeMes(resumen, mes);
  const anterior = resumenDeMes(resumen, ultimosMeses(mes, 2)[0]);
  const top = useMemo(() => productosDelMes(ventas, mes), [ventas, mes]);

  const serie = ultimosMeses(mes, 12).map((m) => {
    const r = resumenDeMes(resumen, m);
    return { mes: nombreMes(m), Ingresos: r.ingresos, "Costos + gastos": r.costoVendido + r.gastos, "Ganancia neta": r.gananciaNeta };
  });

  // Tabla: todos los meses con movimiento, del más nuevo al más viejo.
  const filas = Object.values(resumen).sort((a, b) => b.mes.localeCompare(a.mes));
  const totales = filas.reduce(
    (t, f) => ({
      ingresos: t.ingresos + f.ingresos,
      costoVendido: t.costoVendido + f.costoVendido,
      gastos: t.gastos + f.gastos,
      gananciaNeta: t.gananciaNeta + f.gananciaNeta,
    }),
    { ingresos: 0, costoVendido: 0, gastos: 0, gananciaNeta: 0 }
  );

  const variacion =
    anterior.ingresos > 0 ? ((actual.ingresos - anterior.ingresos) / anterior.ingresos) * 100 : null;

  return (
    <DashboardLayout title="Resumen" actions={<SelectorMes mes={mes} onChange={setMes} />}>
      {l1 || l2 ? (
        <PageLoader />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Ingresos"
              icon={Wallet}
              value={pesos(actual.ingresos)}
              hint={
                variacion === null
                  ? `${actual.cantidadVentas} venta(s)`
                  : `${variacion >= 0 ? "▲" : "▼"} ${pct(Math.abs(variacion))} vs mes anterior`
              }
            />
            <Stat
              label="Costo de lo vendido"
              icon={TrendingUp}
              value={pesos(actual.costoVendido)}
              hint={`Ganancia bruta ${pesos(actual.gananciaBruta)} (${pct(actual.margenBruto)})`}
            />
            <Stat label="Gastos fijos" icon={Receipt} value={pesos(actual.gastos)} />
            <Stat
              label="Ganancia neta"
              icon={PiggyBank}
              value={pesos(actual.gananciaNeta)}
              tono={actual.gananciaNeta >= 0 ? "positivo" : "negativo"}
              hint={`Margen neto ${pct(actual.margenNeto)}`}
            />
          </div>

          <Card>
            <div className="mb-3 text-sm font-semibold text-ink-900">Últimos 12 meses</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => compacto.format(v)} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(v) => pesos(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Ingresos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Costos + gastos" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  <Line dataKey="Ganancia neta" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card className="p-0">
              <div className="px-5 pt-5 text-sm font-semibold text-ink-900">Mes a mes</div>
              <div className="overflow-x-auto p-5 pt-3">
                {filas.length === 0 ? (
                  <p className="text-sm text-ink-500">Todavía no hay ventas ni gastos cargados.</p>
                ) : (
                  <table className="w-full min-w-[520px] text-sm tabular-nums">
                    <thead className="text-xs text-ink-500">
                      <tr className="text-right">
                        <th className="pb-2 text-left font-normal">Mes</th>
                        <th className="pb-2 font-normal">Ingresos</th>
                        <th className="pb-2 font-normal">Costo prod.</th>
                        <th className="pb-2 font-normal">Gastos</th>
                        <th className="pb-2 font-normal">Ganancia</th>
                        <th className="pb-2 font-normal">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/30">
                      {filas.map((f) => (
                        <tr
                          key={f.mes}
                          onClick={() => setMes(f.mes)}
                          className={`cursor-pointer text-right hover:bg-surface-subtle ${f.mes === mes ? "bg-brand-50" : ""}`}
                        >
                          <td className="whitespace-nowrap py-2 text-left font-medium text-ink-900">{nombreMes(f.mes, true)}</td>
                          <td>{pesos(f.ingresos)}</td>
                          <td className="text-ink-500">{pesos(f.costoVendido)}</td>
                          <td className="text-ink-500">{pesos(f.gastos)}</td>
                          <td className={f.gananciaNeta >= 0 ? "text-emerald-600" : "text-red-600"}>{pesos(f.gananciaNeta)}</td>
                          <td>{pct(f.margenNeto)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-ink-300/50 font-semibold">
                      <tr className="text-right">
                        <td className="pt-2 text-left">Total</td>
                        <td className="pt-2">{pesos(totales.ingresos)}</td>
                        <td className="pt-2">{pesos(totales.costoVendido)}</td>
                        <td className="pt-2">{pesos(totales.gastos)}</td>
                        <td className="pt-2">{pesos(totales.gananciaNeta)}</td>
                        <td className="pt-2">
                          {pct(totales.ingresos > 0 ? (totales.gananciaNeta / totales.ingresos) * 100 : null)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </Card>

            <Card className="p-0">
              <div className="px-5 pt-5 text-sm font-semibold text-ink-900">Productos vendidos en {nombreMes(mes, true)}</div>
              <div className="overflow-x-auto p-5 pt-3">
                {top.length === 0 ? (
                  <p className="text-sm text-ink-500">No hay ventas en este mes.</p>
                ) : (
                  <table className="w-full min-w-[420px] text-sm tabular-nums">
                    <thead className="text-xs text-ink-500">
                      <tr className="text-right">
                        <th className="pb-2 text-left font-normal">Producto</th>
                        <th className="pb-2 font-normal">Cantidad</th>
                        <th className="pb-2 font-normal">Vendido</th>
                        <th className="pb-2 font-normal">Ganancia</th>
                        <th className="pb-2 font-normal">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/30">
                      {top.map((p) => (
                        <tr key={p.nombre} className="text-right">
                          <td className="py-2 text-left font-medium text-ink-900">{p.nombre}</td>
                          <td>{cant(p.cantidad)} {p.unidad}</td>
                          <td>{pesos(p.ingresos)}</td>
                          <td className="text-emerald-600">{pesos(p.ganancia)}</td>
                          <td>{pct(p.margen)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
