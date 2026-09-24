import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Each variant states its own disabled look.
 *
 * There used to be a blanket `disabled:opacity-60` on the base class instead.
 * It is the usual shortcut and it compounds: the primary button's disabled
 * colours measured 4.63:1 on their own, and the fade took the label to 2.29:1 —
 * a submit button you cannot read, which is exactly the moment someone needs to
 * read it to work out what they are still missing.
 *
 * WCAG exempts disabled controls from contrast, so none of this is required.
 * It is here because "you may not press this yet" is information, and hiding it
 * behind a fade is a strange way to deliver it.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-accent-2 disabled:bg-warm disabled:text-muted",
  secondary:
    "border border-subtle bg-paper text-ink hover:bg-cream disabled:bg-cream disabled:text-muted",
  ghost: "text-muted hover:text-ink",
  danger:
    "border border-danger/40 bg-danger/10 text-danger-ink hover:bg-danger/20 disabled:border-subtle disabled:bg-cream disabled:text-muted",
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
      className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]}`}
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
