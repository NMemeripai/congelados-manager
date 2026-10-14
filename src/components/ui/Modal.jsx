import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Diálogo accesible.
 * - Celular: ocupa toda la pantalla (como una pantalla más, no una ventanita).
 * - Escritorio: ventana centrada.
 * - Escape cierra, el foco queda adentro y vuelve al botón que lo abrió.
 */
export default function Modal({ open, onClose, title, description, children, wide = false, footer }) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previo = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foco inicial: primer campo, o el panel.
    requestAnimationFrame(() => {
      const el = panel.current;
      if (!el) return;
      const primero = el.querySelector("[data-autofocus]") || el.querySelector("input,select,textarea") || el;
      primero.focus({ preventScroll: true });
    });

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
      } else if (e.key === "Tab" && panel.current) {
        const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (previo && previo.focus) previo.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink-900/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={clsx(
          "flex h-full w-full flex-col bg-surface outline-none sm:h-auto sm:max-h-[92vh] sm:rounded-2xl sm:shadow-card",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-300/40 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:border-0 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-semibold text-ink-900">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-ink-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-500 hover:bg-surface-muted hover:text-ink-900"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:pt-2">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-ink-300/40 bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-2xl sm:px-6 sm:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
