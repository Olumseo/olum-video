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
        // 3.04:1. Same fix, same reason, as client-web's banner.
        <p className="bg-accent-ink px-4 py-1.5 text-center font-mono text-[11px] text-paper">
          sample data — not connected to the API
        </p>
      )}
      <header className="border-b border-subtle">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">{title}</span>
          <nav className="flex gap-4">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  pathname === item.to
                    ? "text-sm text-ink underline underline-offset-4"
                    : "text-sm text-muted hover:text-ink"
                }
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
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
