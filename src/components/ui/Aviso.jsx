import clsx from "clsx";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const TIPOS = {
  info: { cls: "border-brand-100 bg-brand-50 text-brand-900", icon: Info },
  ok: { cls: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CheckCircle2 },
  alerta: { cls: "border-amber-200 bg-amber-50 text-amber-900", icon: AlertTriangle },
  error: { cls: "border-red-200 bg-red-50 text-red-900", icon: XCircle },
};

/** Mensaje con ícono + texto (no depende solo del color). */
export default function Aviso({ tipo = "info", titulo, children, className, role }) {
  const { cls, icon: Icon } = TIPOS[tipo];
  return (
    <div role={role} className={clsx("flex gap-3 rounded-2xl border p-3 text-sm", cls, className)}>
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}
