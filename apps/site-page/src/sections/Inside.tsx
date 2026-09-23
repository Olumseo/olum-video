/**
 * What the product actually looks like.
 *
 * The panel on the right is a mock of client-web's video list, built in DOM
 * rather than dropped in as a screenshot. Three reasons, in order: a
 * screenshot of a real account is customer data on a public page; a screenshot
 * goes stale the first time we restyle a badge; and a real DOM panel animates,
 * scales to any viewport and stays sharp on every display without shipping a
 * 400KB asset.
 *
 * It is `aria-hidden`. Read aloud it is a list of invented video titles with
 * invented statuses — indistinguishable from real content, and useless. The
 * copy beside it carries the meaning.
 */

import { Reveal, RevealLines } from "@olum-video/ui";

const ROWS = [
  { title: "Why most SEO audits miss AI search", meta: "0:48 · today", state: "review" },
  { title: "Three things we shipped this week", meta: "1:12 · yesterday", state: "editing" },
  { title: "Answering the question we get most", meta: "0:39 · Tuesday", state: "published" },
  { title: "A short note on pricing changes", meta: "0:55 · Monday", state: "published" },
] as const;

const STATE_STYLES: Record<(typeof ROWS)[number]["state"], { label: string; className: string }> = {
  review: { label: "Needs your review", className: "border-accent/40 bg-accent/10 text-accent-ink" },
  // `text-muted` is tuned against --paper; on the slightly darker --cream it
  // lands at 4.32:1, just under the line. Ink at 75% clears it comfortably and
  // keeps the chip visually quieter than the two coloured ones beside it.
  editing: { label: "In our edit", className: "border-subtle bg-cream text-ink/75" },
  published: {
    label: "Published",
    className: "border-success/30 bg-success/10 text-success-ink",
  },
};

export function Inside() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:py-40">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start lg:gap-20">
        <div className="lg:sticky lg:top-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Inside the app
          </p>
          <RevealLines
            as="h2"
            className="mt-5 font-serif text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.08] tracking-tight"
            lines={["One list.", "Every video you own."]}
          />
          <Reveal delay={120}>
            <p className="mt-6 max-w-readable text-[15px] leading-relaxed text-muted">
              Send a prompt in the morning. The video moves through our edit, lands back with you
              for review, and publishes on your approval. You can see exactly where every one of
              them is, and how many revisions you have left.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <a
              href="/video"
              className="link-underline mt-8 inline-flex items-center gap-2 text-sm text-ink"
            >
              Open the app
              <span aria-hidden>→</span>
            </a>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div
            aria-hidden
            className="rounded-lg border border-subtle bg-paper shadow-[0_28px_70px_-36px_rgb(var(--ink-rgb)/0.35)]"
          >
            <div className="flex items-center gap-2 border-b border-subtle px-5 py-3.5">
              <span className="h-2 w-2 rounded-full bg-ink/15" />
              <span className="h-2 w-2 rounded-full bg-ink/15" />
              <span className="h-2 w-2 rounded-full bg-ink/15" />
              <span className="ml-3 font-mono text-[11px] uppercase tracking-widest text-muted">
                olum.ai/video
              </span>
            </div>

            <div className="space-y-3 p-5">
              {ROWS.map((row, i) => {
                const state = STATE_STYLES[row.state];
                return (
                  // Each row is its own Reveal so the list assembles top to
                  // bottom instead of the whole card fading in as one slab.
                  <Reveal key={row.title} delay={160 + i * 110}>
                    <div
                      className={`rounded border bg-paper px-4 py-3.5 transition-colors ${
                        row.state === "review" ? "border-accent/40" : "border-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-sm text-ink">{row.title}</p>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${state.className}`}
                        >
                          {state.label}
                        </span>
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-muted">{row.meta}</p>

                      {/* The one row in production gets a progress bar that
                          keeps moving, so the panel is never completely still
                          — a frozen mock reads as a screenshot after all. */}
                      {row.state === "editing" && (
                        <span className="mt-3 block h-px w-full overflow-hidden bg-ink/10">
                          <span className="edit-progress block h-full bg-accent" />
                        </span>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
