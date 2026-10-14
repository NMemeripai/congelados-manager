import clsx from "clsx";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-ink-300/30 bg-surface p-5 shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
