import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { INVENTARIO_TABS } from "./layout/navLinks";

/** Pestañas para moverse entre Productos, Insumos y Movimientos (sobre todo en celular). */
export default function InventarioTabs() {
  return (
    <nav aria-label="Inventario" className="mb-4 md:hidden">
      <ul className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-muted p-1">
        {INVENTARIO_TABS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold",
                  isActive ? "bg-surface text-brand-800 shadow-soft" : "text-ink-700"
                )
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
