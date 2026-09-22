/**
 * One brief — the "context page".
 *
 * The client's view of it, which is narrower than the staff view on purpose.
 * They see what they asked for, what we know about them that we're using, and
 * where it has got to. They do NOT see the draft script before a person has
 * checked it: showing an unreviewed draft invites "can you change this word"
 * on something that is about to be rewritten anyway, and it quietly turns the
 * client into the editor.
 */

import { Link, useParams } from "react-router-dom";
import { api, type Brief } from "@olum-video/api-client";
import { Reveal } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/**
 * How each state reads to the CLIENT.
 *
 * Not the raw status. "generating" is an implementation word; the client needs
 * to know whether anyone is doing anything and whether it is their turn.
 */
const VIEW: Record<
  Brief["status"],
  { label: string; tone: string; heading: string; body: string }
> = {
  generating: {
    label: "Being written",
    tone: "text-accent-ink",
    heading: "We're writing it now.",
    body: "One of our people is turning your prompt into a script. You'll hear from us when there's something to look at.",
  },
  ready_for_staff: {
    label: "In review",
    tone: "text-indigo-ink",
    heading: "A second pair of eyes.",
    body: "The script is written and being checked before it goes anywhere near your avatar.",
  },
  generation_failed: {
    label: "Needs another go",
    tone: "text-flare-ink",
    heading: "That one didn't work.",
    body: "Something went wrong on our side, so it hasn't cost you a video. We're picking it back up.",
  },
  approved: {
    label: "In production",
    tone: "text-success-ink",
    heading: "Approved — it's being made.",
    body: "The script is signed off and your video is in production. It'll appear in your videos when it's ready to watch.",
  },
  rejected: {
    label: "Not going ahead",
    tone: "text-muted",
    heading: "We didn't take this one on.",
    body: "It hasn't cost you a video. The reason is below — send another whenever you like.",
  },
};

export default function BriefDetail() {
  const { id = "" } = useParams();
  const { data: brief, error, loading, retry } = useAsync(() => api.getBrief(id), [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-3 w-24 rounded bg-warm" />
        <div className="mt-5 h-9 w-2/3 rounded bg-warm" />
        <div className="mt-8 h-32 rounded-card bg-warm/60" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <p className="py-24 text-center text-sm text-muted">
        We couldn&rsquo;t load that.{" "}
        <button onClick={retry} className="link-underline text-ink">
          Try again
        </button>
      </p>
    );
  }

  const view = VIEW[brief.status];
  const facts = Object.entries(brief.context ?? {}).filter(
    ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <Link
          to="/briefs"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
        >
          &larr; All requests
        </Link>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="font-display text-[clamp(1.7rem,4.4vw,2.6rem)] leading-[1.14] tracking-tight">
            {brief.title}
          </h1>
          <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${view.tone}`}>
            {view.label}
          </span>
        </div>
      </Reveal>

      {/* Status, on the dark panel. It is the answer to the only question the
          client came here with, so it gets the surface that carries weight. */}
      <Reveal delay={60}>
        <div className="mt-8 overflow-hidden rounded-panel bg-panel px-7 py-8 text-paper shadow-[0_40px_80px_-52px_rgb(var(--ink-rgb)/0.8)] sm:px-9">
          <span aria-hidden className="mb-7 block h-px w-full bg-spectrum opacity-70" />
          <h2 className="font-display text-[clamp(1.25rem,2.8vw,1.7rem)] leading-tight">
            {view.heading}
          </h2>
          <p className="mt-3 max-w-readable text-[14px] leading-relaxed text-paper/70">
            {view.body}
          </p>

          {brief.failure_reason && (
            <p className="mt-5 rounded-[12px] bg-paper/5 px-4 py-3 text-[13px] leading-relaxed text-paper/80">
              {brief.failure_reason}
            </p>
          )}

          {brief.video_id && (
            <Link
              to={`/videos/${brief.video_id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm text-ink transition-opacity hover:opacity-90"
            >
              Watch its progress
              <span aria-hidden>&rarr;</span>
            </Link>
          )}
        </div>
      </Reveal>

      <Reveal delay={110}>
        <section className="mt-12">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            What you asked for
          </h2>
          <p className="mt-4 max-w-readable font-serif text-[clamp(1.05rem,2.2vw,1.35rem)] leading-[1.55] text-ink">
            {brief.prompt}
          </p>
        </section>
      </Reveal>

      {facts.length > 0 && (
        <Reveal delay={150}>
          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              What we&rsquo;re writing it with
            </h2>
            <p className="mt-2 max-w-readable text-[13px] leading-relaxed text-muted">
              Pulled from what we already know about you, so you don&rsquo;t have to say it
              again every time.
            </p>
            <dl className="mt-5 divide-y divide-subtle border-y border-subtle">
              {facts.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:w-44 sm:shrink-0">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="text-[14px] leading-relaxed text-ink">
                    {Array.isArray(value) ? value.join(" · ") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      )}

      {brief.rounds > 0 && (
        <Reveal delay={190}>
          <p className="mt-8 text-[13px] text-muted">
            Rewritten {brief.rounds} {brief.rounds === 1 ? "time" : "times"} before we were
            happy with it.
          </p>
        </Reveal>
      )}
    </div>
  );
}
