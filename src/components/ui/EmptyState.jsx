export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-300/60 px-6 py-12 text-center">
      {Icon && <Icon size={28} className="text-ink-300" />}
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {children && <p className="max-w-sm text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
