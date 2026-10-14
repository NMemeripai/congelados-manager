import { useMemo, useState } from "react";
import { Plus, Trash2, ShoppingCart, X, ChevronDown } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import Stat from "../components/ui/Stat";
import SelectorMes from "../components/SelectorMes";
import CargaPorVoz from "../components/CargaPorVoz";
import { interpretar, METODOS_PAGO } from "../lib/voz";
import { useInsumos, useProductos, useVentas } from "../hooks/useColeccion";
import * as ventasService from "../services/ventasService";
import {
  costearProducto,
  indexarPorId,
  totalesVenta,
  num,
  pesos,
  pct,
  cant,
  hoy,
  mesDe,
  margen,
} from "../lib/costeo";


export default function Ventas() {
  const { data: ventas, loading } = useVentas();
  const { data: productos } = useProductos();
  const { data: insumos } = useInsumos();
  const [mes, setMes] = useState(mesDe(hoy()));
  const [abierto, setAbierto] = useState(false);
  const [aBorrar, setABorrar] = useState(null);
  const [expandida, setExpandida] = useState(null);

  // Productos con su costo y precio de HOY, para cargar ventas nuevas.
  const catalogo = useMemo(() => {
    const porId = indexarPorId(insumos);
    return [...productos]
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((p) => ({ ...p, calc: costearProducto(p, porId) }));
  }, [productos, insumos]);

  const delMes = useMemo(
    () =>
      ventas
        .filter((v) => mesDe(v.fecha) === mes)
        .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || (b.creadoEn || 0) - (a.creadoEn || 0)),
    [ventas, mes]
  );
  const tot = delMes.reduce(
    (t, v) => ({ total: t.total + num(v.total), costo: t.costo + num(v.costoTotal) }),
    { total: 0, costo: 0 }
  );

  return (
    <DashboardLayout
      title="Ventas"
      actions={
        <>
          <SelectorMes mes={mes} onChange={setMes} />
          <Button icon={Plus} onClick={() => setAbierto(true)} disabled={catalogo.length === 0}>
            Nueva venta
          </Button>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Vendido" value={pesos(tot.total)} />
        <Stat label="Costo de producción" value={pesos(tot.costo)} />
        <Stat label="Ganancia bruta" value={pesos(tot.total - tot.costo)} tono={tot.total - tot.costo >= 0 ? "positivo" : "negativo"} />
        <Stat label="Margen" value={pct(margen(tot.total, tot.costo))} hint={`${delMes.length} venta(s)`} />
      </div>

      {loading ? (
        <PageLoader />
      ) : catalogo.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Primero creá tus productos">
          Para registrar ventas necesitás tener al menos un producto con su receta (sección Productos).
        </EmptyState>
      ) : delMes.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No hay ventas este mes"
          action={<Button icon={Plus} onClick={() => setAbierto(true)}>Registrar una venta</Button>}
        />
      ) : (
        <Card className="divide-y divide-ink-300/30 p-0">
          {delMes.map((v) => (
            <div key={v.id}>
              <button
                onClick={() => setExpandida(expandida === v.id ? null : v.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-subtle"
              >
                <div className="w-12 shrink-0 text-xs text-ink-500">{v.fecha?.slice(8, 10)}/{v.fecha?.slice(5, 7)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {(v.items || []).map((it) => `${cant(it.cantidad)} ${it.unidad} ${it.nombre}`).join(", ")}
                  </div>
                  <div className="text-xs text-ink-500">
                    {[v.cliente, v.metodoPago].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-ink-900">{pesos(v.total)}</div>
                  <div className="text-xs tabular-nums text-emerald-600">+{pesos(v.ganancia)}</div>
                </div>
                <ChevronDown size={16} className={`text-ink-500 transition ${expandida === v.id ? "rotate-180" : ""}`} />
              </button>
              {expandida === v.id && (
                <div className="bg-surface-subtle px-4 py-3 text-sm">
                  <table className="w-full text-left">
                    <thead className="text-xs text-ink-500">
                      <tr>
                        <th className="font-normal">Producto</th>
                        <th className="text-right font-normal">Cant.</th>
                        <th className="text-right font-normal">Precio</th>
                        <th className="text-right font-normal">Costo</th>
                        <th className="text-right font-normal">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {(v.items || []).map((it, i) => (
                        <tr key={i}>
                          <td>{it.nombre}</td>
                          <td className="text-right">{cant(it.cantidad)} {it.unidad}</td>
                          <td className="text-right">{pesos(it.precioUnit)}</td>
                          <td className="text-right text-ink-500">{pesos(it.costoUnit)}</td>
                          <td className="text-right">{pesos(num(it.cantidad) * num(it.precioUnit))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-ink-500">Margen de esta venta: {pct(margen(v.total, v.costoTotal))}</span>
                    <Button variant="ghost" icon={Trash2} onClick={() => setABorrar(v)} className="px-2 py-1.5 text-red-600">
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title="Nueva venta" wide>
        {abierto && (
          <FormVenta
            catalogo={catalogo}
            onCancel={() => setAbierto(false)}
            onSave={async (data) => {
              await ventasService.crear(data);
              setAbierto(false);
              setMes(mesDe(data.fecha));
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!aBorrar}
        onClose={() => setABorrar(null)}
        onConfirm={() => ventasService.eliminar(aBorrar.id)}
        title="Eliminar venta"
      >
        ¿Eliminar la venta del {aBorrar?.fecha} por <b>{pesos(aBorrar?.total)}</b>?
      </ConfirmModal>
    </DashboardLayout>
  );
}

function FormVenta({ catalogo, onCancel, onSave }) {
  const porId = indexarPorId(catalogo);
  const itemDe = (p) => ({ productoId: p.id, cantidad: "1", precioUnit: String(Math.round(p.calc.precio)) });

  const [fecha, setFecha] = useState(hoy());
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [items, setItems] = useState([itemDe(catalogo[0])]);
  const [guardando, setGuardando] = useState(false);

  // Cada item lleva el costo de producción de HOY (queda guardado así para siempre).
  const itemsCompletos = items
    .map((it) => {
      const p = porId[it.productoId];
      return {
        productoId: it.productoId,
        nombre: p?.nombre || "?",
        unidad: p?.unidadVenta || "u",
        cantidad: num(it.cantidad),
        precioUnit: num(it.precioUnit),
        costoUnit: Math.round((p?.calc.costoUnitario || 0) * 100) / 100,
      };
    })
    .filter((it) => it.cantidad > 0);
  const t = totalesVenta(itemsCompletos);

  const cambiar = (idx, cambios) => setItems(items.map((it, i) => (i === idx ? { ...it, ...cambios } : it)));

  // Completa el formulario con lo que se dictó. No guarda: el usuario revisa y confirma.
  async function cargarPorVoz(texto) {
    const productos = catalogo.map((p) => ({ id: p.id, nombre: p.nombre, unidadVenta: p.unidadVenta, precio: p.calc.precio }));
    const { datos, aviso } = await interpretar("venta", texto, { productos });
    if (!datos.items.length) {
      return { ok: false, texto: "No reconocí ningún producto. Decí el nombre como está cargado." };
    }
    setItems(
      datos.items.map((it) => {
        const p = porId[it.productoId];
        return {
          productoId: it.productoId,
          cantidad: String(it.cantidad),
          precioUnit: String(it.precioUnit ?? Math.round(p.calc.precio)),
        };
      })
    );
    if (datos.fecha) setFecha(datos.fecha);
    if (datos.cliente) setCliente(datos.cliente);
    if (datos.metodoPago) setMetodoPago(datos.metodoPago);
    return { ok: true, texto: (aviso ? aviso + " " : "") + "Revisá los datos y tocá Guardar venta." };
  }

  async function guardar(e) {
    e.preventDefault();
    if (itemsCompletos.length === 0) return;
    setGuardando(true);
    try {
      await onSave({ fecha, cliente: cliente.trim(), metodoPago, items: itemsCompletos, ...t });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <CargaPorVoz
        ejemplo={`vendí 2 kilos de ${catalogo[0]?.nombre.toLowerCase() || "ravioles"} a 9000, pagó con transferencia`}
        onInterpretar={cargarPorVoz}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        <Input label="Cliente (opcional)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        <Select label="Pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          {METODOS_PAGO.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-700">Productos</span>
          <Button type="button" variant="ghost" icon={Plus} onClick={() => setItems([...items, itemDe(catalogo[0])])} className="px-2 py-1.5">
            Agregar
          </Button>
        </div>
        <div className="mb-1 hidden gap-2 text-xs text-ink-500 sm:flex">
          <span className="flex-1">Producto</span>
          <span className="w-20 text-right">Cantidad</span>
          <span className="w-28 text-right">Precio unit.</span>
          <span className="w-24 text-right">Subtotal</span>
          <span className="w-7" />
        </div>
        <div className="flex flex-col gap-2">
          {items.map((it, idx) => {
            const p = porId[it.productoId];
            const debajoDelCosto = p && num(it.precioUnit) < p.calc.costoUnitario;
            return (
              <div key={idx}>
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <select
                    value={it.productoId}
                    onChange={(e) => cambiar(idx, itemDe(porId[e.target.value]))}
                    className="w-full min-w-0 flex-1 rounded-xl border border-ink-300/50 bg-surface px-2 py-2 text-sm sm:w-auto"
                  >
                    {catalogo.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.unidadVenta})
                      </option>
                    ))}
                  </select>
                  <input
                    inputMode="decimal"
                    value={it.cantidad}
                    onChange={(e) => cambiar(idx, { cantidad: e.target.value })}
                    className="w-20 rounded-xl border border-ink-300/50 px-2 py-2 text-right text-sm"
                  />
                  <input
                    inputMode="decimal"
                    value={it.precioUnit}
                    onChange={(e) => cambiar(idx, { precioUnit: e.target.value })}
                    className="w-28 rounded-xl border border-ink-300/50 px-2 py-2 text-right text-sm"
                  />
                  <span className="w-24 text-right text-sm tabular-nums text-ink-700">
                    {pesos(num(it.cantidad) * num(it.precioUnit))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    disabled={items.length === 1}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-surface-muted disabled:opacity-30"
                  >
                    <X size={16} />
                  </button>
                </div>
                {debajoDelCosto && (
                  <p className="mt-1 text-xs text-red-600">
                    Ojo: ese precio está por debajo del costo ({pesos(p.calc.costoUnitario)} por {p.unidadVenta}).
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-subtle p-4 text-sm">
        <div>
          <div className="text-xs text-ink-500">Total</div>
          <div className="text-lg font-semibold tabular-nums text-ink-900">{pesos(t.total)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500">Costo</div>
          <div className="text-lg tabular-nums text-ink-700">{pesos(t.costoTotal)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500">Ganancia</div>
          <div className={`text-lg font-semibold tabular-nums ${t.ganancia >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {pesos(t.ganancia)}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={guardando} disabled={itemsCompletos.length === 0}>
          Guardar venta
        </Button>
      </div>
    </form>
  );
}
