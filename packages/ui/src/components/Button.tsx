import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-accent-2 disabled:bg-muted",
  secondary: "border border-subtle bg-paper text-ink hover:bg-cream",
  ghost: "text-muted hover:text-ink",
  danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Shows a spinner and blocks clicks. Use for in-flight requests. */
  loading?: boolean;
}

export function Button({ variant = "primary", loading, disabled, children, ...rest }: Props) {
  return (
    <button
      // `disabled` while loading is what actually prevents a double submit —
      // hiding the label alone would still let a fast second click through.
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
