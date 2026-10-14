import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts";
import { Wallet, Receipt, Package, TrendingUp, PiggyBank, Percent, Boxes, HandCoins, AlertTriangle, Table2, BarChart3 } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import SelectorPeriodo from "../components/SelectorPeriodo";
import Card from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import Aviso from "../components/ui/Aviso";
import Button from "../components/ui/Button";
import PageLoader from "../components/ui/PageLoader";
import { useNegocio } from "../hooks/useNegocio";
import { usePeriodo } from "../context/PeriodoContext";
import { nombrePeriodoAnterior } from "../lib/periodos";
import {
  totalesRango,
  productosRango,
  gastosCategoriaRango,
  serieRango,
  resumenPorMes,
  valorInventario,
  porCobrar,
  stockBajo,
  nombreMes,
  num,
  pesos,
  pct,
  cant,
  parseFecha,
  hoy,
} from "../lib/costeo";

// Paleta validada (CVD/contraste) con el validador de dataviz.
const C = { ingresos: "#2563eb", costos: "#d9480f", ganancia: "#047857" };
const compacto = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });
const conSigno = (v) => `${v >= 0 ? "+" : "−"}${pesos(Math.abs(v))}`;

function variacion(actual, anterior) {
  if (!anterior) return null;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}

export default function Resumen() {
  const { ventas, gastos, insumos, productos, loading } = useNegocio();
  const { tipo, rango, anterior, etiqueta } = usePeriodo();
  const [verTabla, setVerTabla] = useState(false);

  const t = useMemo(() => totalesRango(ventas, gastos, rango.desde, rango.hasta), [ventas, gastos, rango]);
  const tAnt = useMemo(() => totalesRango(ventas, gastos, anterior.desde, anterior.hasta), [ventas, gastos, anterior]);
  const ranking = useMemo(() => productosRango(ventas, rango.desde, rango.hasta), [ventas, rango]);
  const cats = useMemo(() => gastosCategoriaRango(gastos, rango.desde, rango.hasta), [gastos, rango]);
  const catsAnt = useMemo(() => Object.fromEntries(gastosCategoriaRango(gastos, anterior.desde, anterior.hasta).map((c) => [c.categoria, c.monto])), [gastos, anterior]);
  const serie = useMemo(() => serieRango(ventas, gastos, rango.desde, rango.hasta), [ventas, gastos, rango]);
  const inventario = valorInventario(insumos, productos);
  const fiado = porCobrar(ventas);
  const meses = useMemo(() => Object.values(resumenPorMes(ventas, gastos)).sort((a, b) => b.mes.localeCompare(a.mes)).slice(0, 12), [ventas, gastos]);

  const alertas = useMemo(() => {
    const a = [];
    const bajosI = insumos.filter((i) => stockBajo(i) || num(i.stock) < 0);
    const bajosP = productos.filter((p) => stockBajo(p) || num(p.stock) < 0);
    if (bajosI.length) a.push({ tipo: "error", texto: `Stock bajo de insumos: ${bajosI.map((i) => i.nombre).join(", ")}.`, to: "/insumos" });
    if (bajosP.length) a.push({ tipo: "error", texto: `Stock bajo de productos: ${bajosP.map((p) => p.nombre).join(", ")}.`, to: "/productos" });
    const conPerdida = productos.filter((p) => p.calc.gananciaUnitaria < 0);
    if (conPerdida.length) a.push({ tipo: "error", texto: `Se venden por debajo del costo: ${conPerdida.map((p) => p.nombre).join(", ")}.`, to: "/productos" });
    const viejos = insumos.filter((i) => i.precioActualizado && (parseFecha(hoy()) - parseFecha(i.precioActualizado)) / 86400000 > 30);
    if (viejos.length) a.push({ tipo: "alerta", texto: `${viejos.length} insumo(s) con precio sin actualizar hace más de 30 días: los costos pueden estar desactualizados.`, to: "/insumos" });
    if (fiado.total > 0) a.push({ tipo: "info", texto: `Tenés ${pesos(fiado.total)} fiado sin cobrar (${fiado.lista.length} venta/s).`, to: "/ventas" });
    return a;
  }, [insumos, productos, fiado.total, fiado.lista.length]);

  const vIngresos = variacion(t.ingresos, tAnt.ingresos);
  const vNeta = variacion(t.gananciaNeta, tAnt.gananciaNeta);
  const sinMovimiento = t.ingresos === 0 && t.gastos === 0;
  const ant = nombrePeriodoAnterior[tipo];
  const maxGanancia = Math.max(1, ...ranking.map((r) => Math.abs(r.ganancia)));

  return (
    <DashboardLayout title="Resumen">
      <SelectorPeriodo className="mb-4" />

      {loading ? (
        <PageLoader />
      ) : (
        <div className="flex flex-col gap-4">
          {/* ¿Estoy ganando o perdiendo? */}
          {sinMovimiento ? (
            <Aviso tipo="info" titulo={`Sin movimientos en ${etiqueta.toLowerCase()}`}>
              Registrá ventas y gastos para ver tu resultado. Usá el botón + para cargar rápido.
            </Aviso>
          ) : t.gananciaNeta >= 0 ? (
            <Aviso tipo="ok" titulo={`Ganaste ${pesos(t.gananciaNeta)} en ${etiqueta.toLowerCase()}`}>
              Margen neto del {pct(t.margenNeto)}: de cada $100 que vendiste te quedaron ${Math.round(t.margenNeto ?? 0)}.
              {vNeta !== null && ` ${vNeta >= 0 ? "▲" : "▼"} ${pct(Math.abs(vNeta))} vs ${ant}.`}
            </Aviso>
          ) : (
            <Aviso tipo="error" titulo={`Estás perdiendo ${pesos(Math.abs(t.gananciaNeta))} en ${etiqueta.toLowerCase()}`}>
              {t.gananciaBruta < 0
                ? "Vendés por debajo de lo que te cuesta producir: revisá precios en Productos."
                : `Las ventas dejan ${pesos(t.gananciaBruta)} de ganancia bruta, pero los gastos (${pesos(t.gastos)}) son más altos.`}
            </Aviso>
          )}

          {/* Indicadores */}
          <section aria-label="Indicadores del período" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Ingresos por ventas"
              icon={Wallet}
              value={pesos(t.ingresos)}
              hint={vIngresos === null ? `${t.cantidadVentas} venta(s)` : `${vIngresos >= 0 ? "▲" : "▼"} ${pct(Math.abs(vIngresos))} vs ${ant}`}
            />
            <Stat label="Gastos operativos" icon={Receipt} value={pesos(t.gastos)} hint={t.ingresos ? `${pct((t.gastos / t.ingresos) * 100)} de lo vendido` : undefined} />
            <Stat label="Costo de lo vendido" icon={Package} value={pesos(t.costoVendido)} hint="Insumos de lo que vendiste" />
            <Stat label="Ganancia bruta" icon={TrendingUp} value={conSigno(t.gananciaBruta)} tono={t.gananciaBruta >= 0 ? "positivo" : "negativo"} hint={`Margen bruto ${pct(t.margenBruto)}`} />
            <Stat
              label={t.gananciaNeta >= 0 ? "Ganancia neta" : "Pérdida neta"}
              icon={PiggyBank}
              value={conSigno(t.gananciaNeta)}
              tono={t.gananciaNeta >= 0 ? "positivo" : "negativo"}
              hint="Bruta menos gastos"
            />
            <Stat label="Margen neto" icon={Percent} value={pct(t.margenNeto)} tono={t.margenNeto === null ? "neutral" : t.margenNeto >= 0 ? "positivo" : "negativo"} hint="Ganancia neta / ingresos" />
            <Stat label="Valor del inventario" icon={Boxes} value={pesos(inventario.total)} hint={`Insumos ${pesos(inventario.insumos)} · productos ${pesos(inventario.productos)}`} />
            <Stat label="Por cobrar (fiado)" icon={HandCoins} value={pesos(fiado.total)} tono={fiado.total > 0 ? "brand" : "neutral"} hint={`${fiado.lista.length} venta(s) pendientes`} />
          </section>

          {alertas.length > 0 && (
            <section aria-labelledby="alertas-t">
              <h2 id="alertas-t" className="mb-2 flex items-center gap-2 text-base font-semibold text-ink-900">
                <AlertTriangle size={18} aria-hidden="true" /> Para revisar
              </h2>
              <ul className="flex flex-col gap-2">
                {alertas.map((a, i) => (
                  <li key={i}>
                    <Aviso tipo={a.tipo}>
                      {a.texto}{" "}
                      <Link to={a.to} className="font-semibold underline underline-offset-2">
                        Ver
                      </Link>
                    </Aviso>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Evolución */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink-900">Evolución: {etiqueta.toLowerCase()}</h2>
              <Button variant="ghost" icon={verTabla ? BarChart3 : Table2} onClick={() => setVerTabla(!verTabla)} aria-pressed={verTabla} className="px-3">
                {verTabla ? "Ver gráfico" : "Ver tabla"}
              </Button>
            </div>
            {verTabla ? (
              <TablaSerie serie={serie} />
            ) : (
              <figure>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={serie} margin={{ top: 5, right: 4, left: 0, bottom: 0 }} barGap={2} accessibilityLayer title="Gráfico de ingresos, costos y ganancia" desc="Usá las flechas izquierda y derecha para recorrer las fechas">
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} minTickGap={12} />
                      <YAxis tickFormatter={(v) => compacto.format(v)} tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} width={44} />
                      <Tooltip formatter={(v, n) => [pesos(v), n]} contentStyle={{ borderRadius: 12, fontSize: 13, borderColor: "#cbd5e1" }} cursor={{ fill: "#f1f5f9" }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#334155" }} />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="ingresos" name="Ingresos" fill={C.ingresos} radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="costos" name="Costos + gastos" fill={C.costos} radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Line dataKey="ganancia" name="Ganancia neta" stroke={C.ganancia} strokeWidth={2} dot={serie.length <= 31 ? { r: 3 } : false} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <figcaption className="mt-2 text-xs text-ink-500">
                  Ingresos {pesos(t.ingresos)}, costos y gastos {pesos(t.costoVendido + t.gastos)}, resultado {conSigno(t.gananciaNeta)}. Tocá “Ver tabla” para el detalle.
                </figcaption>
              </figure>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Productos más rentables */}
            <Card className="p-4">
              <h2 className="mb-3 text-base font-semibold text-ink-900">Productos más rentables</h2>
              {ranking.length === 0 ? (
                <p className="text-sm text-ink-500">No hay ventas en este período.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {ranking.map((r, i) => (
                    <li key={r.id}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-medium text-ink-900">
                          {i + 1}. {r.nombre}
                        </span>
                        <span className={`shrink-0 font-semibold tabular-nums ${r.ganancia >= 0 ? "text-emerald-700" : "text-red-700"}`}>{conSigno(r.ganancia)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-surface-muted" aria-hidden="true">
                        <div className="h-2 rounded-full" style={{ width: `${(Math.abs(r.ganancia) / maxGanancia) * 100}%`, background: r.ganancia >= 0 ? C.ganancia : "#b91c1c" }} />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {cant(r.cantidad)} {r.unidad} · vendido {pesos(r.ingresos)} · margen {pct(r.margen)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            {/* Gastos a controlar */}
            <Card className="p-4">
              <h2 className="mb-3 text-base font-semibold text-ink-900">Gastos a controlar</h2>
              {cats.length === 0 ? (
                <p className="text-sm text-ink-500">No hay gastos en este período.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {cats.map((c) => {
                    const v = variacion(c.monto, catsAnt[c.categoria] || 0);
                    return (
                      <li key={c.categoria}>
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-medium text-ink-900">{c.categoria}</span>
                          <span className="tabular-nums text-ink-900">{pesos(c.monto)}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-surface-muted" aria-hidden="true">
                          <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(c.monto / cats[0].monto) * 100}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-ink-500">
                          {t.ingresos > 0 ? `${pct((c.monto / t.ingresos) * 100)} de lo vendido` : "Sin ventas para comparar"}
                          {v !== null && (
                            <span className={v > 10 ? "font-semibold text-red-700" : ""}>
                              {" "}
                              · {v >= 0 ? "▲" : "▼"} {pct(Math.abs(v))} vs {ant}
                            </span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Resumen de todos los meses */}
          <Card className="p-4">
            <h2 className="mb-3 text-base font-semibold text-ink-900">Mes a mes</h2>
            {meses.length === 0 ? (
              <p className="text-sm text-ink-500">Todavía no hay ventas ni gastos cargados.</p>
            ) : (
              <>
                {/* Celular: tarjetas */}
                <ul className="flex flex-col divide-y divide-ink-300/40 md:hidden">
                  {meses.map((f) => (
                    <li key={f.mes} className="py-3">
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold text-ink-900">{nombreMes(f.mes, true)}</span>
                        <span className={`font-semibold tabular-nums ${f.gananciaNeta >= 0 ? "text-emerald-700" : "text-red-700"}`}>{conSigno(f.gananciaNeta)}</span>
                      </div>
                      <dl className="mt-1 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-ink-500">Ingresos</dt>
                          <dd className="tabular-nums text-ink-900">{pesos(f.ingresos)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-500">Costo + gastos</dt>
                          <dd className="tabular-nums text-ink-900">{pesos(f.costoVendido + f.gastos)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-500">Margen</dt>
                          <dd className="tabular-nums text-ink-900">{pct(f.margenNeto)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
                {/* Escritorio: tabla */}
                <div className="hidden md:block">
                  <table className="w-full text-sm tabular-nums">
                    <caption className="sr-only">Resultado de cada mes</caption>
                    <thead className="text-xs text-ink-500">
                      <tr className="text-right">
                        <th scope="col" className="pb-2 text-left font-medium">Mes</th>
                        <th scope="col" className="pb-2 font-medium">Ingresos</th>
                        <th scope="col" className="pb-2 font-medium">Costo de lo vendido</th>
                        <th scope="col" className="pb-2 font-medium">Gastos</th>
                        <th scope="col" className="pb-2 font-medium">Ganancia neta</th>
                        <th scope="col" className="pb-2 font-medium">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/40">
                      {meses.map((f) => (
                        <tr key={f.mes} className="text-right">
                          <th scope="row" className="py-2 text-left font-medium text-ink-900">{nombreMes(f.mes, true)}</th>
                          <td>{pesos(f.ingresos)}</td>
                          <td className="text-ink-700">{pesos(f.costoVendido)}</td>
                          <td className="text-ink-700">{pesos(f.gastos)}</td>
                          <td className={`font-semibold ${f.gananciaNeta >= 0 ? "text-emerald-700" : "text-red-700"}`}>{conSigno(f.gananciaNeta)}</td>
                          <td>{pct(f.margenNeto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

/** Tabla accesible con los mismos datos del gráfico. */
function TablaSerie({ serie }) {
  const filas = serie.filter((r) => r.ingresos || r.costos);
  if (!filas.length) return <p className="text-sm text-ink-500">Sin movimientos en este período.</p>;
  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">Ingresos, costos y ganancia por fecha</caption>
        <thead className="sticky top-0 bg-surface text-xs text-ink-500">
          <tr className="text-right">
            <th scope="col" className="pb-2 text-left font-medium">Fecha</th>
            <th scope="col" className="pb-2 font-medium">Ingresos</th>
            <th scope="col" className="pb-2 font-medium">Costos + gastos</th>
            <th scope="col" className="pb-2 font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-300/40">
          {filas.map((r) => (
            <tr key={r.clave} className="text-right">
              <th scope="row" className="py-2 text-left font-medium text-ink-900">{r.etiqueta}</th>
              <td>{pesos(r.ingresos)}</td>
              <td>{pesos(r.costos)}</td>
              <td className={r.ganancia >= 0 ? "text-emerald-700" : "text-red-700"}>{conSigno(r.ganancia)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
