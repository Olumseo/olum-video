import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useScrolled } from "@olum-video/ui";

import { useSmoothScroll } from "../motion/useSmoothScroll";

/**
 * Page frame for the marketing site.
 *
 * Unlike the app shells in client-web and staff-portal, this one puts NO width
 * constraint on `<main>`. Every page here is full-bleed by design — the hero
 * spans the viewport, the showcase panel and the marquee run edge to edge — so
 * each route owns its own container. Pricing and the 404 page wrap themselves.
 *
 * `to` values are written WITHOUT the deploy prefix ("/pricing", not
 * "/video/welcome/pricing"). react-router's basename prepends it. That is what
 * lets the same code run at localhost:5202/ in dev and olum.ai/video/welcome/
 * in prod.
 */
export default function Shell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: { to: string; label: string }[];
  children: ReactNode;
}) {
  const { pathname, hash } = useLocation();
  const scrolled = useScrolled(40);

  // Momentum scrolling, site-wide. It only touches the wheel — see the hook for
  // what it deliberately leaves alone.
  useSmoothScroll();

  /**
   * Scroll to the top on navigation.
   *
   * react-router does not do this, and the browser's own restoration does not
   * apply to a client-side route change. Without it, following "See pricing"
   * from three screens down /how-it-works lands you three screens down a page
   * that is one screen tall — which looks like a blank page.
   *
   * A hash is the exception: that navigation is a request to go somewhere
   * specific, and the browser's own anchor handling is already doing it.
   */
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return (
    <div className="grain min-h-screen bg-paper font-sans text-ink">
      {/* Skip link. On a page whose first section is four screens of pinned
          scroll, a keyboard visitor tabbing from the header has a long way to
          go before reaching anything else. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-luxe ${
          // Transparent over the hero, then a blurred bar once the page moves.
          // `supports-[backdrop-filter]` keeps the fallback opaque rather than
          // leaving the nav unreadable where backdrop-filter is unavailable.
          scrolled
            ? "border-b border-subtle bg-paper/95 supports-[backdrop-filter]:bg-paper/70 supports-[backdrop-filter]:backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 transition-all duration-500 ease-luxe ${
            scrolled ? "py-3" : "py-5"
          }`}
        >
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink"
          >
            {/* The mark: the spectrum, compressed into a dot. It is the smallest
                possible statement of the palette and it appears on every page,
                which is most of what makes the set feel like one site. */}
            <span aria-hidden className="h-2 w-2 rounded-full bg-spectrum" />
            {title}
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                data-active={pathname === item.to}
                className={`link-underline whitespace-nowrap text-sm transition-colors ${
                  pathname === item.to ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* Every "Get started" goes to the sign-up form: the app
                is not open for self-serve yet, so the next step for a visitor
                is to leave verified details and be contacted. */}
                        <Link
              to="/get-started"
              className="hidden shrink-0 rounded-full bg-ink px-5 py-2 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)] sm:inline-flex"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="relative overflow-hidden border-t border-subtle">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">olum.video</p>
            <p className="mt-2 text-sm text-muted">
              An AI daily video studio built on one recording of you.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link to="/results" className="link-underline text-muted hover:text-ink">
              Results
            </Link>
            <Link to="/how-it-works" className="link-underline text-muted hover:text-ink">
              How it works
            </Link>
            <Link to="/pricing" className="link-underline text-muted hover:text-ink">
              Pricing
            </Link>
            <Link to="/get-started" className="link-underline text-muted hover:text-ink">
              Get started
            </Link>
            {/* The live olum.ai site, absolutely. A bare "/" only worked when
                this app happened to be served under olum.ai — locally and on
                any preview domain it went nowhere useful. */}
            <a href="https://olum.ai" className="link-underline text-muted hover:text-ink">
              olum.ai
            </a>
          </div>
        </div>

        {/* The oversized wordmark, cropped by the viewport edge.

            It is decorative and `aria-hidden` — the footer above already says
            the name, and a screen reader does not need it twice. `select-none`
            because dragging across it selects a word nobody wanted. The clip is
            the effect: a wordmark that fits neatly looks like a logo, one that
            runs past the edge looks like a poster. */}
        <div aria-hidden className="select-none px-6 pb-2 pt-4">
          <p className="text-spectrum mx-auto max-w-7xl whitespace-nowrap text-center font-serif text-[clamp(3.5rem,17vw,15rem)] leading-[0.8] tracking-tight opacity-25">
            olum.video
          </p>
        </div>
      </footer>
    </div>
  );
}
