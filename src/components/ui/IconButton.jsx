import clsx from "clsx";

const TONOS = {
  neutral: "text-ink-500 hover:bg-surface-muted hover:text-ink-900",
  danger: "text-ink-500 hover:bg-red-50 hover:text-red-700",
  brand: "text-brand-700 hover:bg-brand-50",
};

/** Botón solo-ícono de 44×44 con nombre accesible obligatorio. */
export default function IconButton({ icon: Icon, label, tono = "neutral", className, size = 18, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40", TONOS[tono], className)}
      {...props}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  );
}
