/**
 * The site's call-to-action pill, in the four looks it comes in.
 *
 * Every section of the home page now ends in one or two of these, so the
 * classes live here rather than being pasted a dozen times — a button that
 * drifts a shade from its neighbours reads as a different kind of action.
 *
 * `to` starting with "/" is a route and renders a router `Link`; anything else
 * ("#showcase", "mailto:…") is a plain anchor, which is what keeps same-page
 * jumps using the browser's own anchor scroll.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Look = "primary" | "ghost" | "light" | "outline-light";

const LOOKS: Record<Look, string> = {
  primary:
    "bg-ink text-paper hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]",
  ghost: "border border-subtle bg-paper/70 text-ink backdrop-blur-sm hover:border-ink/25 hover:bg-cream",
  // The two below are for the dark showcase panel only.
  light: "bg-paper text-ink hover:bg-cream",
  "outline-light": "border border-paper/30 text-paper hover:border-paper/60",
};

export function Cta({
  to,
  look = "primary",
  small = false,
  arrow = false,
  className = "",
  onClick,
  children,
}: {
  to: string;
  look?: Look;
  small?: boolean;
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const classes = `inline-flex items-center gap-2 whitespace-nowrap rounded-full text-sm transition-all duration-500 ease-luxe ${
    small ? "px-5 py-2.5" : "px-7 py-3.5"
  } ${LOOKS[look]} ${className}`;
  const body = (
    <>
      {children}
      {arrow && <span aria-hidden>→</span>}
    </>
  );

  return to.startsWith("/") ? (
    <Link to={to} className={classes} onClick={onClick}>
      {body}
    </Link>
  ) : (
    <a href={to} className={classes} onClick={onClick}>
      {body}
    </a>
  );
}
