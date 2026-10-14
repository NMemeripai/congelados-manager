import clsx from "clsx";
import Card from "./Card";

const TONOS = {
  neutral: "text-ink-900",
  positivo: "text-emerald-600",
  negativo: "text-red-600",
  brand: "text-brand-700",
};

export default function Stat({ label, value, hint, tono = "neutral", icon: Icon }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
        {Icon && <Icon size={15} />}
      </div>
      <div className={clsx("text-xl font-semibold tabular-nums", TONOS[tono])}>{value}</div>
      {hint && <div className="text-xs text-ink-500">{hint}</div>}
    </Card>
  );
}
