import clsx from "clsx";

const VARIANTS = {
  primary: "bg-brand-600 text-white shadow-pop hover:bg-brand-700",
  secondary: "bg-surface-muted text-ink-900 hover:bg-ink-300/40",
  ghost: "text-ink-700 hover:bg-surface-muted",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-ink-300/70 bg-surface text-ink-900 hover:bg-surface-muted",
};

/** Botón con altura mínima de 44px (objetivo táctil cómodo). */
export default function Button({ children, icon: Icon, variant = "primary", loading = false, className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        className
      )}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={18} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
