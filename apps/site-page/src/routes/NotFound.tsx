import { Link } from "react-router-dom";

import { Annotation } from "../components/Marks";

/**
 * Owns its own container: Shell no longer wraps `<main>` in one, because the
 * landing page is full-bleed. `pt-40` clears the fixed header.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-32 pt-40">
      <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
        404
      </p>
      <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight">
        Page not found
      </h1>
      <span aria-hidden className="mt-6 block h-0.5 w-24 rounded-full bg-spectrum" />
      <div className="mt-8 flex flex-wrap items-center gap-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2"
        >
          Back to start
          <span aria-hidden>→</span>
        </Link>
        <Annotation arrow="up-left" className="hidden sm:flex">
          Nothing lost. Your videos are fine.
        </Annotation>
      </div>
    </div>
  );
}
