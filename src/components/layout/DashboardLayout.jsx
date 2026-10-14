import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";

/**
 * Estructura de cada pantalla. Mobile first: barra inferior en celular, lateral desde 768px.
 * `toolbar`: controles de la pantalla (filtros, botón principal) arriba del contenido.
 */
export default function DashboardLayout({ title, toolbar, children }) {
  return (
    <div className="flex min-h-full bg-surface-subtle md:h-screen">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:overflow-y-auto">
        <Topbar title={title} />
        <main id="contenido" tabIndex={-1} className="mb-safe-nav mx-auto w-full max-w-7xl flex-1 px-4 py-4 outline-none md:mb-0 md:px-6 md:py-6">
          {toolbar && <div className="mb-4 flex flex-wrap items-center gap-2">{toolbar}</div>}
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
