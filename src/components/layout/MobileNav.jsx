import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { LINKS_MOVIL } from "./navLinks";
import { ACCIONES } from "./acciones";
import Modal from "../ui/Modal";

function Item({ to, label, icon: Icon, match }) {
  const { pathname } = useLocation();
  const activoExtra = match?.some((m) => pathname.startsWith(m));
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        clsx(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
          isActive || activoExtra ? "text-brand-700" : "text-ink-500"
        )
      }
      aria-current={activoExtra ? "page" : undefined}
    >
      <Icon size={22} aria-hidden="true" />
      {label}
    </NavLink>
  );
}

/** Barra inferior para usar con una mano, con botón de carga rápida en el centro. */
export default function MobileNav() {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();
  const [a, b, c, d] = LINKS_MOVIL;

  return (
    <>
      <nav aria-label="Principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-ink-300/40 bg-surface/95 backdrop-blur md:hidden">
        <div className="flex items-stretch">
          <Item {...a} />
          <Item {...b} />
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setAbierto(true)}
              aria-label="Cargar rápido: venta, gasto, compra o producción"
              aria-haspopup="dialog"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop ring-4 ring-surface-subtle"
            >
              <Plus size={28} aria-hidden="true" />
            </button>
          </div>
          <Item {...c} />
          <Item {...d} />
        </div>
      </nav>

      <Modal open={abierto} onClose={() => setAbierto(false)} title="¿Qué querés cargar?">
        <ul className="grid gap-2">
          {ACCIONES.map(({ label, desc, icon: Icon, to }) => (
            <li key={to}>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  navigate(to);
                }}
                className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-ink-300/50 bg-surface p-4 text-left hover:bg-surface-subtle"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-ink-900">{label}</span>
                  <span className="block text-sm text-ink-500">{desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
