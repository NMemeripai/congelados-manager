// src/lib/periodos.js
// Períodos para filtrar: día, semana (lunes a domingo), mes, año o personalizado.
import { parseFecha, fmtFecha, hoy, nombreMes, diasEntre, fechaLarga } from "./costeo.js";

export const TIPOS = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
  { id: "personalizado", label: "Otro" },
];

/** Rango del período que contiene la fecha `ref`. */
export function rangoDe(tipo, ref = hoy(), personalizado) {
  const d = parseFecha(ref);
  if (tipo === "dia") return { desde: ref, hasta: ref };
  if (tipo === "semana") {
    const dow = (d.getDay() + 6) % 7; // lunes = 0
    const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
    const fin = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 6);
    return { desde: fmtFecha(ini), hasta: fmtFecha(fin) };
  }
  if (tipo === "anio") return { desde: `${d.getFullYear()}-01-01`, hasta: `${d.getFullYear()}-12-31` };
  if (tipo === "personalizado" && personalizado?.desde && personalizado?.hasta) {
    const [a, b] = [personalizado.desde, personalizado.hasta].sort();
    return { desde: a, hasta: b };
  }
  // mes (y personalizado sin fechas)
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { desde: fmtFecha(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: fmtFecha(fin) };
}

/** Mueve la fecha de referencia un período hacia atrás (-1) o adelante (+1). */
export function mover(tipo, ref, dir) {
  const d = parseFecha(ref);
  if (tipo === "dia") return fmtFecha(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir));
  if (tipo === "semana") return fmtFecha(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * dir));
  if (tipo === "anio") return fmtFecha(new Date(d.getFullYear() + dir, d.getMonth(), 1));
  return fmtFecha(new Date(d.getFullYear(), d.getMonth() + dir, 1));
}

/** Período anterior de la misma duración (para comparar). */
export function rangoAnterior(tipo, ref, rango) {
  if (tipo !== "personalizado") return rangoDe(tipo, mover(tipo, ref, -1));
  const dias = diasEntre(rango.desde, rango.hasta);
  const fin = parseFecha(rango.desde);
  fin.setDate(fin.getDate() - 1);
  const ini = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - dias + 1);
  return { desde: fmtFecha(ini), hasta: fmtFecha(fin) };
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Texto para mostrar el período. */
export function etiquetaRango(tipo, ref, rango) {
  if (tipo === "dia") {
    if (ref === hoy()) return "Hoy";
    const d = parseFecha(ref);
    return `${DIAS[d.getDay()]} ${fechaLarga(ref)}`.replace(/^./, (c) => c.toUpperCase());
  }
  if (tipo === "semana") return `Semana del ${fechaLarga(rango.desde).slice(0, 5)} al ${fechaLarga(rango.hasta)}`;
  if (tipo === "mes") return nombreMes(rango.desde.slice(0, 7), true);
  if (tipo === "anio") return `Año ${rango.desde.slice(0, 4)}`;
  return `${fechaLarga(rango.desde)} al ${fechaLarga(rango.hasta)}`;
}

export const nombrePeriodoAnterior = {
  dia: "el día anterior",
  semana: "la semana anterior",
  mes: "el mes anterior",
  anio: "el año anterior",
  personalizado: "el período anterior",
};
