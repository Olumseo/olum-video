import type { ReactNode } from "react";

/**
 * Label + control + help/error text.
 *
 * `htmlFor`/`id` are required rather than optional: without the pairing, a
 * screen reader announces the control with no name, and clicking the label
 * does not focus the input.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ink">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded border border-subtle bg-paper px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";
