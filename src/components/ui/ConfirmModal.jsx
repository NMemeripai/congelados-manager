import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

/** Confirmación antes de una acción destructiva. */
export default function ConfirmModal({ open, onClose, onConfirm, title = "¿Eliminar?", confirmLabel = "Eliminar", children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
      setError("No se pudo completar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2 sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none" data-autofocus>
            Cancelar
          </Button>
          <Button variant="danger" loading={loading} onClick={confirmar} className="flex-1 sm:flex-none">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-ink-700">{children}</div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </Modal>
  );
}
