// src/lib/costeo.js
// Toda la lógica de números del sistema vive acá: conversión de unidades,
// costo de cada receta, precio sugerido y resumen mensual.
// Las páginas solo muestran lo que estas funciones calculan.

// ---------- Unidades ----------
// Cada unidad pertenece a un grupo y tiene un factor respecto a la base del grupo.
// Así podés comprar la manteca por kg y usar 200 g en la receta.
export const UNIDADES = {
  kg: { grupo: "masa", factor: 1, label: "kg" },
  g: { grupo: "masa", factor: 0.001, label: "g" },
  l: { grupo: "volumen", factor: 1, label: "litro" },
  ml: { grupo: "volumen", factor: 0.001, label: "ml" },
  u: { grupo: "unidad", factor: 1, label: "unidad" },
  docena: { grupo: "unidad", factor: 12, label: "docena" },
};

export const UNIDADES_COMPRA = ["kg", "l", "u", "docena", "g", "ml"];
export const UNIDADES_VENTA = ["kg", "u", "docena", "caja", "plancha", "porción"];

/** Unidades en las que se puede cargar un ingrediente, según cómo se compra el insumo. */
export function unidadesCompatibles(unidadInsumo) {
  const grupo = UNIDADES[unidadInsumo]?.grupo;
  if (!grupo) return [unidadInsumo];
  return Object.keys(UNIDADES).filter((u) => UNIDADES[u].grupo === grupo);
}

/** Convierte una cantidad de una unidad a otra del mismo grupo. */
export function convertir(cantidad, desde, hacia) {
  const a = UNIDADES[desde];
  const b = UNIDADES[hacia];
  if (!a || !b || a.grupo !== b.grupo) return num(cantidad);
  return (num(cantidad) * a.factor) / b.factor;
}

// ---------- Helpers ----------
/** Acepta "1,5" o "1.5" (en Argentina se escribe con coma). */
export function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmtPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
export const pesos = (v) => fmtPesos.format(num(v));

export const pct = (v) =>
  v === null || !Number.isFinite(v) ? "—" : `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;

export const cant = (v) => num(v).toLocaleString("es-AR", { maximumFractionDigits: 3 });

/** Fecha local de hoy en formato YYYY-MM-DD (sin el corrimiento de UTC). */
export function hoy() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const mesDe = (fecha) => String(fecha || "").slice(0, 7); // "2026-10"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export function nombreMes(mes, largo = false) {
  const [y, m] = mes.split("-").map(Number);
  return `${(largo ? MESES_LARGOS : MESES)[m - 1]} ${largo ? y : String(y).slice(2)}`;
}

/** Lista de los últimos `n` meses terminando en `hasta` (YYYY-MM), del más viejo al más nuevo. */
export function ultimosMeses(hasta, n = 12) {
  let [y, m] = hasta.split("-").map(Number);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

// ---------- Ganancia ----------
/**
 * Dos formas de expresar la ganancia, que NO son lo mismo:
 * - markup: cuánto le sumás al costo  -> (precio - costo) / costo
 * - margen: qué parte del precio es ganancia -> (precio - costo) / precio
 * Ej: costo 10.000, precio 14.000 => markup 40%, margen 28,6%.
 */
export function markup(precio, costo) {
  const c = num(costo);
  return c > 0 ? ((num(precio) - c) / c) * 100 : null;
}
export function margen(precio, costo) {
  const p = num(precio);
  return p > 0 ? ((p - num(costo)) / p) * 100 : null;
}

// ---------- Recetas ----------
/**
 * Calcula el costo de una receta con los precios ACTUALES de los insumos.
 * producto = { rinde, unidadVenta, ingredientes: [{insumoId, cantidad, unidad}],
 *              costosExtra, markupObjetivo, precioVenta }
 */
export function costearProducto(producto, insumosPorId) {
  const ingredientes = (producto?.ingredientes || []).map((ing) => {
    const insumo = insumosPorId[ing.insumoId];
    if (!insumo) {
      return { ...ing, nombre: "(insumo borrado)", costo: 0, faltante: true };
    }
    const cantidadEnUnidadInsumo = convertir(ing.cantidad, ing.unidad || insumo.unidad, insumo.unidad);
    const costo = cantidadEnUnidadInsumo * num(insumo.costo);
    return { ...ing, nombre: insumo.nombre, unidadInsumo: insumo.unidad, costo };
  });

  const costoIngredientes = ingredientes.reduce((s, i) => s + i.costo, 0);
  const costosExtra = num(producto?.costosExtra);
  const costoTanda = costoIngredientes + costosExtra;
  const rinde = num(producto?.rinde);
  const costoUnitario = rinde > 0 ? costoTanda / rinde : 0;

  const markupObjetivo = num(producto?.markupObjetivo);
  const precioSugerido = costoUnitario * (1 + markupObjetivo / 100);
  const precioFijado = num(producto?.precioVenta);
  const precio = precioFijado > 0 ? precioFijado : precioSugerido;

  return {
    ingredientes,
    costoIngredientes,
    costosExtra,
    costoTanda,
    costoUnitario,
    precioSugerido,
    precio,
    usaPrecioFijado: precioFijado > 0,
    gananciaUnitaria: precio - costoUnitario,
    markup: markup(precio, costoUnitario),
    margen: margen(precio, costoUnitario),
    tieneFaltantes: ingredientes.some((i) => i.faltante),
  };
}

export function indexarPorId(lista) {
  return Object.fromEntries((lista || []).map((x) => [x.id, x]));
}

// ---------- Ventas ----------
/** Totales de una venta a partir de sus items (cada item guarda el costo del momento). */
export function totalesVenta(items) {
  const total = items.reduce((s, it) => s + num(it.cantidad) * num(it.precioUnit), 0);
  const costoTotal = items.reduce((s, it) => s + num(it.cantidad) * num(it.costoUnit), 0);
  return { total, costoTotal, ganancia: total - costoTotal };
}

// ---------- Resumen mensual ----------
function filaVacia(mes) {
  return {
    mes,
    ingresos: 0,
    costoVendido: 0,
    gananciaBruta: 0,
    gastos: 0,
    gananciaNeta: 0,
    cantidadVentas: 0,
    margenBruto: null,
    margenNeto: null,
  };
}

/** Devuelve un objeto { "2026-10": fila, ... } con todo lo del mes. */
export function resumenPorMes(ventas, gastos) {
  const meses = {};
  const fila = (mes) => (meses[mes] ||= filaVacia(mes));

  for (const v of ventas || []) {
    if (!v.fecha) continue;
    const f = fila(mesDe(v.fecha));
    f.ingresos += num(v.total);
    f.costoVendido += num(v.costoTotal);
    f.cantidadVentas += 1;
  }
  for (const g of gastos || []) {
    if (!g.fecha) continue;
    fila(mesDe(g.fecha)).gastos += num(g.monto);
  }
  for (const f of Object.values(meses)) {
    f.gananciaBruta = f.ingresos - f.costoVendido;
    f.gananciaNeta = f.gananciaBruta - f.gastos;
    f.margenBruto = f.ingresos > 0 ? (f.gananciaBruta / f.ingresos) * 100 : null;
    f.margenNeto = f.ingresos > 0 ? (f.gananciaNeta / f.ingresos) * 100 : null;
  }
  return meses;
}

export function resumenDeMes(resumen, mes) {
  return resumen[mes] || filaVacia(mes);
}

/** Ranking de productos vendidos en un mes. */
export function productosDelMes(ventas, mes) {
  const map = {};
  for (const v of ventas || []) {
    if (mesDe(v.fecha) !== mes) continue;
    for (const it of v.items || []) {
      const key = it.productoId || it.nombre;
      const r = (map[key] ||= { nombre: it.nombre, unidad: it.unidad, cantidad: 0, ingresos: 0, costo: 0 });
      r.cantidad += num(it.cantidad);
      r.ingresos += num(it.cantidad) * num(it.precioUnit);
      r.costo += num(it.cantidad) * num(it.costoUnit);
    }
  }
  return Object.values(map)
    .map((r) => ({ ...r, ganancia: r.ingresos - r.costo, margen: margen(r.ingresos, r.costo) }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

/** Gastos de un mes agrupados por categoría. */
export function gastosPorCategoria(gastos, mes) {
  const map = {};
  for (const g of gastos || []) {
    if (mesDe(g.fecha) !== mes) continue;
    map[g.categoria || "Otros"] = (map[g.categoria || "Otros"] || 0) + num(g.monto);
  }
  return Object.entries(map)
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);
}

// ---------- Redondeo ----------
/** Evita arrastrar errores de coma flotante (0.1 + 0.2) al sumar stock. */
export function redondear(v, dec = 3) {
  const f = 10 ** dec;
  return Math.round(num(v) * f) / f;
}

// ---------- Rangos de fechas ----------
/** fecha "YYYY-MM-DD" dentro de [desde, hasta] (ambos incluidos). */
export const enRango = (fecha, desde, hasta) => !!fecha && fecha >= desde && fecha <= hasta;

/** Totales de un período: ingresos, costo de lo vendido, gastos, ganancias y márgenes. */
export function totalesRango(ventas, gastos, desde, hasta) {
  const f = filaVacia(`${desde}..${hasta}`);
  for (const v of ventas || []) {
    if (!enRango(v.fecha, desde, hasta)) continue;
    f.ingresos += num(v.total);
    f.costoVendido += num(v.costoTotal);
    f.cantidadVentas += 1;
  }
  for (const g of gastos || []) {
    if (enRango(g.fecha, desde, hasta)) f.gastos += num(g.monto);
  }
  f.gananciaBruta = f.ingresos - f.costoVendido;
  f.gananciaNeta = f.gananciaBruta - f.gastos;
  f.margenBruto = f.ingresos > 0 ? (f.gananciaBruta / f.ingresos) * 100 : null;
  f.margenNeto = f.ingresos > 0 ? (f.gananciaNeta / f.ingresos) * 100 : null;
  return f;
}

/** Productos vendidos en el período, ordenados por ganancia (los más rentables primero). */
export function productosRango(ventas, desde, hasta) {
  const map = {};
  for (const v of ventas || []) {
    if (!enRango(v.fecha, desde, hasta)) continue;
    for (const it of v.items || []) {
      const key = it.productoId || it.nombre;
      const r = (map[key] ||= { id: key, nombre: it.nombre, unidad: it.unidad, cantidad: 0, ingresos: 0, costo: 0 });
      r.cantidad += num(it.cantidad);
      r.ingresos += num(it.cantidad) * num(it.precioUnit);
      r.costo += num(it.cantidad) * num(it.costoUnit);
    }
  }
  return Object.values(map)
    .map((r) => ({ ...r, ganancia: r.ingresos - r.costo, margen: margen(r.ingresos, r.costo) }))
    .sort((a, b) => b.ganancia - a.ganancia);
}

/** Gastos del período por categoría, con lo que representan sobre los ingresos. */
export function gastosCategoriaRango(gastos, desde, hasta) {
  const map = {};
  for (const g of gastos || []) {
    if (!enRango(g.fecha, desde, hasta)) continue;
    const c = g.categoria || "Otros";
    map[c] = (map[c] || 0) + num(g.monto);
  }
  return Object.entries(map)
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);
}

/**
 * Serie para el gráfico. Agrupa por día si el período es corto (≤ 62 días), si no por mes.
 * Devuelve [{ clave, etiqueta, ingresos, costos, ganancia }]
 */
export function serieRango(ventas, gastos, desde, hasta) {
  const dias = diasEntre(desde, hasta);
  const porDia = dias <= 62;
  const claves = [];
  if (porDia) {
    let d = parseFecha(desde);
    const fin = parseFecha(hasta);
    while (d <= fin) {
      claves.push(fmtFecha(d));
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
  } else {
    let d = parseFecha(desde.slice(0, 7) + "-01");
    const fin = parseFecha(hasta);
    while (d <= fin) {
      claves.push(fmtFecha(d).slice(0, 7));
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }
  const idx = Object.fromEntries(claves.map((k) => [k, { clave: k, ingresos: 0, costos: 0, ganancia: 0 }]));
  const clave = (fecha) => (porDia ? fecha : fecha.slice(0, 7));
  for (const v of ventas || []) {
    if (!enRango(v.fecha, desde, hasta)) continue;
    const r = idx[clave(v.fecha)];
    if (r) {
      r.ingresos += num(v.total);
      r.costos += num(v.costoTotal);
    }
  }
  for (const g of gastos || []) {
    if (!enRango(g.fecha, desde, hasta)) continue;
    const r = idx[clave(g.fecha)];
    if (r) r.costos += num(g.monto);
  }
  return claves.map((k) => {
    const r = idx[k];
    const etiqueta = porDia ? `${k.slice(8, 10)}/${k.slice(5, 7)}` : nombreMes(k);
    return { ...r, etiqueta, ganancia: r.ingresos - r.costos };
  });
}

// ---------- Fechas ----------
export function parseFecha(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function fmtFecha(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function diasEntre(desde, hasta) {
  return Math.round((parseFecha(hasta) - parseFecha(desde)) / 86400000) + 1;
}
export const fechaCorta = (f) => (f ? `${f.slice(8, 10)}/${f.slice(5, 7)}` : "—");
export const fechaLarga = (f) => (f ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}` : "—");

// ---------- Inventario ----------
/**
 * Valor del inventario a costo actual.
 * insumos: stock (en su unidad de compra) × costo. productos: stock × costo unitario de la receta.
 * El stock negativo no suma (indica que falta registrar una compra o producción).
 */
export function valorInventario(insumos, productosCosteados) {
  const vi = (insumos || []).reduce((s, i) => s + Math.max(0, num(i.stock)) * num(i.costo), 0);
  const vp = (productosCosteados || []).reduce((s, p) => s + Math.max(0, num(p.stock)) * num(p.calc?.costoUnitario), 0);
  return { insumos: vi, productos: vp, total: vi + vp };
}

/** ¿Está por debajo del mínimo? (sin mínimo cargado no alerta) */
export const stockBajo = (item) => num(item.stockMinimo) > 0 && num(item.stock) <= num(item.stockMinimo);

/** Cuánto de cada insumo consume producir `tandas` de un producto (en la unidad del insumo). */
export function consumosProduccion(producto, insumosPorId, tandas) {
  return (producto?.ingredientes || [])
    .map((ing) => {
      const insumo = insumosPorId[ing.insumoId];
      if (!insumo) return null;
      return {
        insumoId: insumo.id,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        cantidad: redondear(convertir(ing.cantidad, ing.unidad || insumo.unidad, insumo.unidad) * num(tandas)),
        disponible: num(insumo.stock),
      };
    })
    .filter(Boolean);
}

// ---------- Cuentas por cobrar ----------
/** Ventas en cuenta corriente (fiado) todavía no cobradas. */
export function porCobrar(ventas) {
  const lista = (ventas || []).filter((v) => v.metodoPago === "Cuenta corriente" && !v.cobrada);
  return { lista, total: lista.reduce((s, v) => s + num(v.total), 0) };
}
