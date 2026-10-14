import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";

export default function DashboardLayout({ title, actions, children }) {
  return (
    <div className="flex h-screen bg-surface-subtle">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar title={title} />
        <main className="flex-1 p-4 pb-24 md:p-6">
          {actions && <div className="mb-5 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
