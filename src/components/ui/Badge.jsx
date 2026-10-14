import clsx from "clsx";

const COLORS = {
  neutral: "bg-surface-muted text-ink-700",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-800",
  brand: "bg-brand-50 text-brand-800",
};

export default function Badge({ children, color = "neutral", icon: Icon, className }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", COLORS[color], className)}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}
