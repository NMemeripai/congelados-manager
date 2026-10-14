export default function Spinner({ size = 24 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="animate-spin rounded-full border-2 border-ink-300 border-t-brand-600"
    />
  );
}
