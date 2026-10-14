import { useId } from "react";
import clsx from "clsx";

const BASE =
  "w-full min-h-11 rounded-xl border bg-surface px-3 py-2.5 text-base text-ink-900 outline-none transition placeholder:text-ink-500/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:text-sm";

/**
 * Contenedor de campo: etiqueta visible, marca de obligatorio, ayuda y error asociados al control.
 * render recibe las props de accesibilidad que tiene que llevar el control.
 */
export function Field({ label, required, hint, error, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={clsx("flex flex-col gap-1.5 text-sm", className)}>
      {label && (
        <label htmlFor={id} className="font-medium text-ink-700">
          {label}
          {required && (
            <span className="text-red-700" aria-hidden="true">
              {" "}*
            </span>
          )}
        </label>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
        className: clsx(BASE, error ? "border-red-600" : "border-ink-300/70"),
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label, required, hint, error, className, fieldClassName, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={fieldClassName}>
      {(a11y) => <input {...a11y} {...props} className={clsx(a11y.className, className)} />}
    </Field>
  );
}

/** Campo numérico: abre el teclado numérico en el celular y acepta coma decimal. */
export function NumberInput({ prefix, suffix, className, ...props }) {
  return (
    <Field {...pick(props, ["label", "required", "hint", "error"])} className={props.fieldClassName}>
      {(a11y) => (
        <div className="relative">
          {prefix && (
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
              {prefix}
            </span>
          )}
          <input
            {...a11y}
            {...omit(props, ["label", "required", "hint", "error", "fieldClassName"])}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={clsx(a11y.className, "text-right tabular-nums", prefix && "pl-7", suffix && "pr-14", className)}
          />
          {suffix && (
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
              {suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}

export function Select({ label, required, hint, error, className, fieldClassName, children, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={fieldClassName}>
      {(a11y) => (
        <select {...a11y} {...props} className={clsx(a11y.className, "pr-8", className)}>
          {children}
        </select>
      )}
    </Field>
  );
}

function pick(o, keys) {
  return Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
}
function omit(o, keys) {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
}
