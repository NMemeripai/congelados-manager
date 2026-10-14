import Button from "../ui/Button";

/** Botones de pie: se dibujan dentro del cuerpo pero quedan fijos abajo en el celular. */
export default function FormFooter({ formId, onClose, guardando, label = "Guardar" }) {
  return (
    <div className="pb-safe sticky -bottom-4 -mx-4 mt-4 flex gap-2 border-t border-ink-300/40 bg-surface px-4 pt-3 pb-3 sm:static sm:mx-0 sm:justify-end sm:border-0 sm:px-0 sm:pb-0">
      <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
        Cancelar
      </Button>
      <Button type="submit" form={formId} loading={guardando} className="flex-[2] sm:flex-none">
        {label}
      </Button>
    </div>
  );
}
