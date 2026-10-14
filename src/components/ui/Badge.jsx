import clsx from "clsx";

const COLORS = {
  neutral: "bg-surface-muted text-ink-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  brand: "bg-brand-50 text-brand-700",
};

export default function Badge({ children, color = "neutral", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLORS[color],
        className
      )}
    >
      {children}
    </span>
  );
}
