/**
 * One request — and, once it reaches them, the place the client approves it.
 *
 * # WHAT CHANGED HERE
 *
 * This screen used to hide the script on purpose: staff wrote it, staff
 * approved it, and showing the client an unreviewed draft would have turned
 * them into the editor. That reasoning was sound for a flow where the client
 * never decided anything.
 *
 * They decide now. Staff finish the script and hand it over, and the person
 * whose face and voice will deliver it says yes or asks for a change. So the
 * script IS shown — but only from `awaiting_client_approval`, which is exactly
 * the moment a human has checked it. Before that the old reasoning still
 * holds and there is nothing worth reading.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, QuotaError } from "@olum-video/api-client";
import { Reveal, presentBrief } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

export default function BriefDetail() {
  const { id = "" } = useParams();
  const { data: brief, error, loading, retry } = useAsync(() => api.getBrief(id), [id]);

  const [busy, setBusy] = useState<"approve" | "changes" | null>(null);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

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

  const view = presentBrief(brief.status, "client");
  const yourTurn = view.turn === "client";
  const roundsLeft = Math.max(0, brief.max_rounds - brief.rounds);

  const facts = Object.entries(brief.context ?? {}).filter(
    ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );

  async function decide(action: "approve" | "changes") {
    setProblem(null);
    setBusy(action);
    try {
      if (action === "approve") {
        await api.approveBrief(id);
      } else {
        await api.requestScriptChanges(id, note.trim());
      }
      retry(); // reload from the server rather than guessing the new state
      setAsking(false);
      setNote("");
    } catch (err) {
      setProblem(
        err instanceof QuotaError || err instanceof Error
          ? err.message
          : "That didn't go through. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

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
          <span
            className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
              yourTurn ? "text-flare-ink" : "text-muted"
            }`}
          >
            {view.label}
          </span>
        </div>
      </Reveal>

      {/* The dark panel answers the only question they came with: whose turn
          is it. When it is theirs, the script and the decision live here too,
          so approving is not a hunt down the page. */}
      <Reveal delay={60}>
        <div className="mt-8 overflow-hidden rounded-panel bg-panel px-7 py-8 text-paper shadow-[0_40px_80px_-52px_rgb(var(--ink-rgb)/0.8)] sm:px-9">
          <span aria-hidden className="mb-7 block h-px w-full bg-spectrum opacity-70" />

          <h2 className="font-display text-[clamp(1.25rem,2.8vw,1.7rem)] leading-tight">
            {yourTurn ? "Your script is ready." : view.label}
          </h2>
          <p className="mt-3 max-w-readable text-[14px] leading-relaxed text-paper/70">
            {view.detail}
          </p>

          {brief.failure_reason && !yourTurn && (
            <p className="mt-5 rounded-[12px] bg-paper/5 px-4 py-3 text-[13px] leading-relaxed text-paper/80">
              {brief.failure_reason}
            </p>
          )}

          {/* The script itself, on the panel, in the serif the videos are
              written in. Reading it here should feel like reading the thing,
              not like reviewing a form field. */}
          {yourTurn && brief.body && (
            <article className="mt-7 max-h-[26rem] overflow-y-auto rounded-[16px] bg-paper/[0.06] px-6 py-6">
              <pre className="whitespace-pre-wrap font-serif text-[15px] leading-[1.7] text-paper/90">
                {brief.body}
              </pre>
            </article>
          )}

          {yourTurn && (
            <div className="mt-7">
              {!asking ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => decide("approve")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm text-ink transition-opacity duration-300 ease-luxe hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === "approve" ? "Approving…" : "Approve — make the video"}
                    <span aria-hidden>&rarr;</span>
                  </button>

                  <button
                    onClick={() => setAsking(true)}
                    disabled={busy !== null || roundsLeft === 0}
                    className="rounded-full border border-paper/25 px-6 py-3 text-sm text-paper/85 transition-colors duration-300 ease-luxe hover:border-paper/50 hover:text-paper disabled:opacity-40"
                  >
                    Ask for changes
                  </button>

                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/45">
                    {roundsLeft > 0
                      ? `${roundsLeft} ${roundsLeft === 1 ? "revision" : "revisions"} left`
                      : "no revisions left"}
                  </span>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="note"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60"
                  >
                    What should change?
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    autoFocus
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Warmer, and cut the last paragraph."
                    className="mt-3 w-full rounded-[14px] border border-paper/20 bg-paper/[0.06] px-4 py-3 text-[14px] leading-relaxed text-paper placeholder:text-paper/35 focus:border-paper/45 focus:outline-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => decide("changes")}
                      disabled={busy !== null || note.trim() === ""}
                      className="rounded-full bg-paper px-6 py-3 text-sm text-ink transition-opacity duration-300 ease-luxe hover:opacity-90 disabled:opacity-40"
                    >
                      {busy === "changes" ? "Sending…" : "Send it back"}
                    </button>
                    <button
                      onClick={() => setAsking(false)}
                      className="text-sm text-paper/60 transition-colors hover:text-paper"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {problem && (
                <p className="mt-4 rounded-[12px] bg-flare/15 px-4 py-3 text-[13px] leading-relaxed text-paper">
                  {problem}
                </p>
              )}
            </div>
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
            {brief.source === "script" ? "The script you sent us" : "What you asked for"}
          </h2>
          <p className="mt-4 max-w-readable font-serif text-[clamp(1.05rem,2.2vw,1.35rem)] leading-[1.55] text-ink">
            {brief.source === "script" ? (brief.body ?? brief.prompt) : brief.prompt}
          </p>
          {brief.source === "script" && (
            <p className="mt-3 text-[13px] text-muted">
              You wrote this one yourself &mdash; we&rsquo;re checking it rather than rewriting it.
            </p>
          )}
        </section>
      </Reveal>

      {facts.length > 0 && (
        <Reveal delay={150}>
          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              What we&rsquo;re writing it with
            </h2>
            <p className="mt-2 max-w-readable text-[13px] leading-relaxed text-muted">
              Pulled from what we already know about you, so you don&rsquo;t have to say it again
              every time.
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
            Rewritten {brief.rounds} {brief.rounds === 1 ? "time" : "times"} so far.
          </p>
        </Reveal>
      )}
    </div>
  );
}
