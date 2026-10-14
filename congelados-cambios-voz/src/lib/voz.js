// src/lib/voz.js
// Convierte lo que dictaste en datos para el formulario.
// 1) Si está configurado VITE_VOZ_WEBHOOK_URL, lo manda a n8n (Gemini) que entiende cualquier forma de decirlo.
// 2) Si no hay webhook o falla, usa un intérprete básico local (sin IA) que entiende frases típicas.
// En ambos casos el resultado SOLO completa el formulario: el usuario revisa y guarda.

import { hoy } from "./costeo";

const WEBHOOK = import.meta.env.VITE_VOZ_WEBHOOK_URL;

export const METODOS_PAGO = ["Efectivo", "Transferencia", "Mercado Pago", "Tarjeta", "Cuenta corriente"];
export const CATEGORIAS_GASTO = [
  "Alquiler",
  "Luz / gas / agua",
  "Sueldos",
  "Monotributo / impuestos",
  "Transporte / envíos",
  "Mantenimiento / equipos",
  "Publicidad",
  "Otros",
];

/**
 * tipo: "venta" | "gasto"
 * contexto: { productos: [{id, nombre, unidadVenta, precio}] }
 * Devuelve { datos, fuente: "ia" | "local", aviso? }
 */
export async function interpretar(tipo, texto, contexto = {}) {
  if (WEBHOOK) {
    try {
      const datos = await viaWebhook(tipo, texto, contexto);
      return { datos: limpiar(tipo, datos, contexto), fuente: "ia" };
    } catch (e) {
      console.warn("Webhook de voz falló, uso el intérprete local:", e);
      const datos = tipo === "venta" ? parsearVenta(texto, contexto.productos || []) : parsearGasto(texto);
      return { datos, fuente: "local", aviso: "La IA no respondió; se interpretó en modo básico." };
    }
  }
  const datos = tipo === "venta" ? parsearVenta(texto, contexto.productos || []) : parsearGasto(texto);
  return { datos, fuente: "local" };
}

async function viaWebhook(tipo, texto, contexto) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      // text/plain evita el "preflight" CORS; n8n lo parsea igual en el Code node.
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      signal: ctrl.signal,
      body: JSON.stringify({
        tipo,
        texto,
        hoy: hoy(),
        productos: (contexto.productos || []).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          unidad: p.unidadVenta,
          precio: Math.round(p.precio || 0),
        })),
        metodosPago: METODOS_PAGO,
        categorias: CATEGORIAS_GASTO,
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    return Array.isArray(json) ? json[0] : json;
  } finally {
    clearTimeout(timer);
  }
}

/** Valida lo que devolvió la IA: descarta productos inexistentes y valores raros. */
function limpiar(tipo, d, contexto) {
  d = d || {};
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(d.fecha || "") ? d.fecha : hoy();
  if (tipo === "gasto") {
    return {
      fecha,
      monto: Number(d.monto) > 0 ? Number(d.monto) : null,
      categoria: CATEGORIAS_GASTO.includes(d.categoria) ? d.categoria : "Otros",
      descripcion: String(d.descripcion || "").slice(0, 120),
    };
  }
  const ids = new Set((contexto.productos || []).map((p) => p.id));
  return {
    fecha,
    cliente: String(d.cliente || "").slice(0, 60),
    metodoPago: METODOS_PAGO.includes(d.metodoPago) ? d.metodoPago : null,
    items: (d.items || [])
      .filter((it) => ids.has(it.productoId) && Number(it.cantidad) > 0)
      .map((it) => ({
        productoId: it.productoId,
        cantidad: Number(it.cantidad),
        precioUnit: Number(it.precioUnit) > 0 ? Number(it.precioUnit) : null,
      })),
  };
}

// ---------------------------------------------------------------------------
// Intérprete local (sin IA)
// ---------------------------------------------------------------------------

const PALABRAS_NUM = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100,
  medio: 0.5, media: 0.5,
};
const VACIAS = new Set(["de", "del", "la", "el", "los", "las", "con", "al", "a", "y", "en", "x", "por"]);

function normalizar(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2") // 9.000 -> 9000
    .replace(/(\d),(\d)/g, "$1.$2") // 1,5 -> 1.5
    .replace(/\$/g, " $ ")
    .replace(/[^a-z0-9.$ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokeniza y convierte números escritos ("tres", "9 mil", "kilo y medio"). */
function tokenizar(texto) {
  const crudos = normalizar(texto).split(" ");
  const out = [];
  for (let i = 0; i < crudos.length; i++) {
    const w = crudos[i];
    let n = /^\d+(\.\d+)?$/.test(w) ? Number(w) : PALABRAS_NUM[w];
    if (n !== undefined) {
      if (crudos[i + 1] === "mil") {
        n *= 1000;
        i++;
      }
      out.push({ w, n });
    } else if (w === "mil") {
      out.push({ w, n: 1000 });
    } else if (/^(kilo|kg|docena)$/.test(w) && (out.length === 0 || out[out.length - 1].n === undefined)) {
      // "kilo de ravioles" = 1 kg, "kilo y medio" = 1,5 kg (sin número delante)
      if (crudos[i + 1] === "y" && /^medi[oa]$/.test(crudos[i + 2] || "")) {
        out.push({ w, n: 1.5 });
        i += 2;
      } else {
        out.push({ w, n: 1 });
      }
    } else {
      out.push({ w });
    }
  }
  return out;
}

const raiz = (w) => w.replace(/(es|s)$/, "");

function palabrasClave(nombre) {
  return normalizar(nombre)
    .split(" ")
    .filter((w) => w.length > 2 && !VACIAS.has(w))
    .map(raiz);
}

/** Busca dónde aparece cada producto en el texto. Devuelve [{producto, ini, fin}] ordenado. */
function encontrarProductos(tokens, productos) {
  const hallados = [];
  for (const p of productos) {
    const claves = palabrasClave(p.nombre);
    if (claves.length === 0) continue;
    // Ventana de búsqueda: todas las claves dentro de 6 palabras seguidas.
    for (let i = 0; i < tokens.length; i++) {
      if (raiz(tokens[i].w) !== claves[0]) continue;
      let fin = i;
      let ok = true;
      for (const c of claves.slice(1)) {
        const j = tokens.findIndex((t, k) => k > i && k <= i + 6 && raiz(t.w) === c);
        if (j === -1) {
          ok = false;
          break;
        }
        fin = Math.max(fin, j);
      }
      if (ok) hallados.push({ producto: p, ini: i, fin, puntaje: claves.length });
    }
  }
  // Si dos productos se superponen ("ravioles" vs "ravioles de verdura") gana el más específico.
  hallados.sort((a, b) => b.puntaje - a.puntaje);
  const elegidos = [];
  for (const h of hallados) {
    if (!elegidos.some((e) => !(h.fin < e.ini || h.ini > e.fin))) elegidos.push(h);
  }
  return elegidos.sort((a, b) => a.ini - b.ini);
}

function detectarFecha(norm) {
  const d = new Date();
  if (/\banteayer\b/.test(norm)) d.setDate(d.getDate() - 2);
  else if (/\bayer\b/.test(norm)) d.setDate(d.getDate() - 1);
  else return hoy();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function detectarPago(norm) {
  if (/mercado ?pago|\bmp\b/.test(norm)) return "Mercado Pago";
  if (/transfer/.test(norm)) return "Transferencia";
  if (/tarjeta|debito|credito/.test(norm)) return "Tarjeta";
  if (/cuenta corriente|fiado|fiad|despues paga|me debe/.test(norm)) return "Cuenta corriente";
  if (/efectivo|cash|contado/.test(norm)) return "Efectivo";
  return null;
}

const CORTE_CLIENTE = new Set([
  "pago", "pagaron", "con", "en", "efectivo", "transferencia", "tarjeta", "mercado", "mp", "que", "y", "a", "por", "hoy", "ayer",
  "fiado", "fiada", "cuenta", "debito", "credito", "contado", "le", "de",
]);
function detectarCliente(texto) {
  const norm = normalizar(texto);
  const m = norm.match(/\b(?:cliente|para|le vendi a|vendido a|a don|a dona)\s+((?:don |dona )?[a-z]+(?: [a-z]+){0,3})/);
  if (!m) return "";
  let palabras = m[1].split(" ");
  const corte = palabras.findIndex((w, i) => i > 0 && CORTE_CLIENTE.has(w));
  if (corte > 0) palabras = palabras.slice(0, corte);
  if (palabras.length === 0 || /^\d/.test(palabras[0])) return "";
  const pref = /a (don|dona) /.test(m[0]) ? [m[0].includes("dona") ? "doña" : "don"] : [];
  return [...pref, ...palabras.filter((w) => w !== "don" || pref.length === 0)]
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function parsearVenta(texto, productos) {
  const tokens = tokenizar(texto);
  const norm = normalizar(texto);
  const hallados = encontrarProductos(tokens, productos);
  const usados = new Set();

  const items = hallados.map((h, idx) => {
    const limiteAnt = idx > 0 ? hallados[idx - 1].fin : -1;
    const limiteSig = idx < hallados.length - 1 ? hallados[idx + 1].ini : tokens.length;

    // Cantidad: número más cercano ANTES del producto.
    let cantidad = null;
    for (let i = h.ini - 1; i > limiteAnt && i >= h.ini - 5; i--) {
      if (tokens[i].n !== undefined && !usados.has(i)) {
        cantidad = tokens[i].n;
        usados.add(i);
        // "kilo y medio", "2 kilos y medio"
        if (tokens[i + 2]?.w === "y" && tokens[i + 3]?.n === 0.5) cantidad += 0.5;
        if (/^gr|^gramo/.test(tokens[i + 1]?.w || "") && h.producto.unidadVenta === "kg") cantidad /= 1000;
        if (tokens[i + 1]?.w === "docena" || tokens[i + 1]?.w === "docenas") {
          if (h.producto.unidadVenta === "u") cantidad *= 12;
        }
        break;
      }
    }
    if (cantidad === null) cantidad = 1;

    // Precio: número DESPUÉS del producto precedido de "a", "$", "por", o seguido de "pesos".
    let precioUnit = null;
    let precioEsTotal = false;
    for (let i = h.fin + 1; i < limiteSig && i <= h.fin + 7; i++) {
      const t = tokens[i];
      if (t.n === undefined || usados.has(i)) continue;
      const prev = tokens[i - 1]?.w;
      const next = tokens[i + 1]?.w;
      if (["a", "$", "por", "en", "total"].includes(prev) || next === "pesos" || next === "el" || t.n >= 100) {
        precioUnit = t.n;
        usados.add(i);
        precioEsTotal = /\b(total|en total|todo)\b/.test(tokens.slice(h.fin, i + 3).map((x) => x.w).join(" "));
        break;
      }
    }
    if (precioUnit !== null && precioEsTotal && cantidad > 0) precioUnit = Math.round(precioUnit / cantidad);

    return { productoId: h.producto.id, cantidad, precioUnit };
  });

  return {
    fecha: detectarFecha(norm),
    cliente: detectarCliente(texto),
    metodoPago: detectarPago(norm),
    items,
  };
}

const REGLAS_GASTO = [
  [/alquiler|alquile/, "Alquiler"],
  [/\bluz\b|\bgas\b|\bagua\b|epec|ecogas|aguas cordobesas|electricidad|garrafa/, "Luz / gas / agua"],
  [/sueldo|empleado|empleada|jornal|quincena|aguinaldo|pague a/, "Sueldos"],
  [/monotributo|afip|arca|impuesto|ingresos brutos|rentas|municipal|tasa/, "Monotributo / impuestos"],
  [/nafta|combustible|flete|envio|reparto|transporte|uber|remis|cadete/, "Transporte / envíos"],
  [/arregl|repara|maquina|heladera|freezer|service|mantenimiento|herramienta|cortadora|amasadora/, "Mantenimiento / equipos"],
  [/publicidad|instagram|facebook|anuncio|meta ads|folleto|cartel/, "Publicidad"],
];

export function parsearGasto(texto) {
  const norm = normalizar(texto);
  const nums = tokenizar(texto).filter((t) => t.n !== undefined).map((t) => t.n);
  const monto = nums.length ? Math.max(...nums) : null;
  let categoria = "Otros";
  for (const [re, cat] of REGLAS_GASTO) {
    if (re.test(norm)) {
      categoria = cat;
      break;
    }
  }
  const descripcion = texto
    .replace(/\$?\s?\d[\d.,]*\s*(mil)?\s*(pesos)?/gi, "")
    .replace(/\b(pagu[eé]|gast[eé]|ayer|hoy|anteayer|de|en)\b\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    fecha: detectarFecha(norm),
    monto,
    categoria,
    descripcion: descripcion.charAt(0).toUpperCase() + descripcion.slice(1),
  };
}
