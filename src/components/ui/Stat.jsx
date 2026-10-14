import clsx from "clsx";
import Card from "./Card";

const TONOS = {
  neutral: "text-ink-900",
  positivo: "text-emerald-700",
  negativo: "text-red-700",
  brand: "text-brand-700",
};

/** Tarjeta de indicador. El color nunca va solo: el valor y el texto explican el resultado. */
export default function Stat({ label, value, hint, tono = "neutral", icon: Icon, className }) {
  return (
    <Card className={clsx("flex flex-col gap-1 p-4", className)}>
      <div className="flex items-start justify-between gap-2 text-xs font-medium uppercase tracking-wide text-ink-500">
        <span>{label}</span>
        {Icon && <Icon size={16} aria-hidden="true" className="shrink-0" />}
      </div>
      <div className={clsx("text-xl font-semibold tabular-nums leading-tight sm:text-2xl", TONOS[tono])}>{value}</div>
      {hint && <div className="text-xs text-ink-500">{hint}</div>}
    </Card>
  );
}
