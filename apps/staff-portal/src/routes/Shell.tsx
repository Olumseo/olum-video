import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { api, isMockApi, type QueueCounts } from "@olum-video/api-client";
import { DevBadge, useStaff } from "@olum-video/ui";

/**
 * Page frame shared by every route in this app.
 *
 * `to` values are written WITHOUT the deploy prefix ("/settings", not
 * "/video/settings"). react-router's basename prepends it. That is what lets
 * the same code run at localhost:5201/ in dev and olum.ai/staff/ in prod.
 *
 * # THE NAV CARRIES NUMBERS
 *
 * A queue you have to open to find out whether it is empty gets opened on a
 * rhythm rather than when there is something in it. The counts come from one
 * server call, scoped to the caller's organisation, so the numbers a staff
 * member sees are the work they can actually do.
 */

/** Which count, if any, belongs beside each nav item. */
const BADGE: Record<string, keyof QueueCounts> = {
  "/my-work": "my_assignments",
  "/onboarding": "onboarding",
  "/briefs": "briefs_to_write",
  "/edits": "videos_to_produce",
};

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
  const staff = useStaff();
  const [counts, setCounts] = useState<QueueCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getQueueCounts()
      .then((c) => !cancelled && setCounts(c))
      // Silent. A badge is a convenience, and a red error bar across the top of
      // every page because one count failed would be worse than no badge.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // Re-read on navigation: acting on something is the moment its count
    // changes, and a stale "3" next to an empty queue is worse than nothing.
  }, [pathname]);

  // olum's own staff have no team to manage. Hidden, not protected — the
  // endpoints behind it refuse a caller with no agency regardless.
  const items = nav.filter((i) => i.to !== "/team" || staff?.agency_id);

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

      {/* Sticky, with a spectrum hairline under it. Seven nav items on one row
          with a long identity badge wrapped into an unreadable block, so the
          identity moved to its own line above the nav rather than competing
          with it for width. */}
      <header className="sticky top-0 z-20 border-b border-subtle bg-paper/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between gap-4 pt-3.5">
            <Link
              to="/"
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
              {title}
            </Link>
            <div className="flex items-center gap-3">
              {staff && (
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:inline">
                  {staff.agency_name ?? "olum"}
                  {staff.position && ` · ${staff.position}`}
                </span>
              )}
              {/* Who am I, and let me be someone else. Dev builds only — the
                  bundler drops this whole branch in production. */}
              {import.meta.env.DEV && <DevBadge />}
            </div>
          </div>

          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => {
              const active = pathname === item.to;
              const key = BADGE[item.to];
              const n = key && counts ? counts[key] : 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-300 ease-luxe ${
                    active ? "bg-ink text-paper" : "text-muted hover:bg-cream hover:text-ink"
                  }`}
                >
                  {item.label}
                  {n > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-px font-mono text-[10px] ${
                        active ? "bg-paper/20 text-paper" : "bg-flare/15 text-flare-ink"
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <span aria-hidden className="block h-px w-full bg-spectrum opacity-40" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
