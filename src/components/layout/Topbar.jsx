import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-ink-300/40 bg-surface/95 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur md:px-6 md:py-3">
      <h1 className="truncate text-lg font-semibold text-ink-900 md:text-xl">{title}</h1>
      <div className="flex items-center gap-1">
        <span className="hidden text-sm text-ink-500 sm:inline">{user?.email}</span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-700 hover:bg-surface-muted"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
