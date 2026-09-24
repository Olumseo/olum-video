import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { isMockApi } from "@olum-video/api-client";
import { DevBadge } from "@olum-video/ui";

/**
 * Page frame shared by every route in this app.
 *
 * `to` values are written WITHOUT the deploy prefix ("/settings", not
 * "/video/settings"). react-router's basename prepends it. That is what lets
 * the same code run at localhost:5200/ in dev and olum.ai/video/ in prod.
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
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      {/* Impossible to miss on purpose. Demoing fixtures while believing they
          are live data is how wrong decisions get made. */}
      {isMockApi && (
        // `bg-accent-ink`, not `bg-accent`: paper on raw terracotta measures
        // 3.04:1, and a warning strip nobody can read is worse than no strip.
        // The darker tier takes the same text to 5.42:1.
        <p className="bg-accent-ink px-4 py-1.5 text-center font-mono text-[11px] text-paper">
          sample data — not connected to the API
        </p>
      )}

      {/* Sticky, not fixed: the mock-data banner above scrolls away with the
          page, and a fixed header would either cover it or need its height
          hard-coded into a top offset that goes wrong the moment the banner
          is absent. */}
      <header className="sticky top-0 z-40 border-b border-subtle bg-paper/95 supports-[backdrop-filter]:bg-paper/80 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          {/* The same spectrum dot the marketing site wears. It is a small
              thing and it is most of what makes signing in feel like staying on
              the same site rather than arriving at a different product. */}
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-spectrum" />
            {title}
          </Link>
          <nav className="flex gap-5">
            {nav.map((item) => (
              // The active state is an underline that grows from the left
              // rather than a toggled `border-bottom`. A border cannot be
              // transitioned smoothly and shifts the label by a pixel when it
              // appears, which makes the whole nav twitch on navigation.
              <Link
                key={item.to}
                to={item.to}
                aria-current={pathname === item.to ? "page" : undefined}
                data-active={pathname === item.to}
                className={`link-underline text-sm transition-colors ${
                  pathname === item.to ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* Who am I, and let me be someone else. Dev builds only — the
                bundler drops this whole branch in production. */}
            {import.meta.env.DEV && <DevBadge />}
          </nav>
        </div>
      </header>

      {/* `key` on the pathname is what makes the transition replay: React tears
          the subtree down and rebuilds it on every navigation, so the CSS
          animation starts again instead of running only on first mount. */}
      <main key={pathname} className="route-enter mx-auto max-w-5xl px-6 py-12">
        {children}
      </main>
    </div>
  );
}
