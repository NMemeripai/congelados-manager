import { NavLink, useNavigate } from "react-router-dom";
import { Calculator, Plus } from "lucide-react";
import clsx from "clsx";
import { LINKS } from "./navLinks";
import { ACCIONES } from "./acciones";

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-300/40 bg-surface p-4 md:flex" aria-label="Barra lateral">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Calculator size={18} aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-ink-900">Producción Manager</span>
      </div>

      <nav aria-label="Principal">
        <ul className="flex flex-col gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  clsx(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                    isActive ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-surface-muted"
                  )
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Cargar rápido</div>
      <ul className="mt-2 flex flex-col gap-1">
        {ACCIONES.map(({ label, icon: Icon, to }) => (
          <li key={to}>
            <button
              type="button"
              onClick={() => navigate(to)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-700 hover:bg-surface-muted"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Plus size={14} aria-hidden="true" />
              </span>
              {label}
              <Icon size={16} aria-hidden="true" className="ml-auto text-ink-500" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
