import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-ink-300/30 bg-surface px-6 py-4">
      <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink-500 sm:inline">{user?.email}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-surface-muted"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
}
