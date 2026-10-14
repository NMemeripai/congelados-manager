import Spinner from "./Spinner";

export default function PageLoader({ texto = "Cargando…" }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-20 text-sm text-ink-500">
      <Spinner />
      <span>{texto}</span>
    </div>
  );
}
