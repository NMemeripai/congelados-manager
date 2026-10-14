import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmModal({ open, onClose, onConfirm, title = "¿Eliminar?", children }) {
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="mb-5 text-sm text-ink-700">{children}</div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" loading={loading} onClick={confirmar}>
          Eliminar
        </Button>
      </div>
    </Modal>
  );
}
