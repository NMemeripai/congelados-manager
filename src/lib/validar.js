/** Lleva el foco al primer campo con error (para teclado y lector de pantalla). */
export function enfocarPrimerError() {
  requestAnimationFrame(() => {
    const el = document.querySelector('[role="dialog"] [aria-invalid="true"], main [aria-invalid="true"]');
    if (el) el.focus();
  });
}
export const sinErrores = (e) => Object.values(e).every((v) => !v);
