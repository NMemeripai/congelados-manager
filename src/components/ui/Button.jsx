import clsx from "clsx";

export default function Button({
  children,
  icon: Icon,
  variant = "primary",
  loading = false,
  className,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand-600 text-white shadow-pop hover:bg-brand-700",
    secondary: "bg-surface-muted text-ink-900 hover:bg-ink-300/40",
    ghost: "text-ink-700 hover:bg-surface-muted",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={clsx(base, variants[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </button>
  );
}
