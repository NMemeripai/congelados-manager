import clsx from "clsx";

export default function Input({ label, className, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-ink-700">{label}</span>}
      <input
        className={clsx(
          "rounded-xl border border-ink-300/50 bg-surface px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      />
    </label>
  );
}
