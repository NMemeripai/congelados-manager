import { NavLink } from "react-router-dom";
import { Calculator } from "lucide-react";
import clsx from "clsx";
import { LINKS } from "./navLinks";

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-300/30 bg-surface p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Calculator size={18} />
        </div>
        <span className="text-sm font-semibold text-ink-900">Producción Manager</span>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-surface-muted"
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
