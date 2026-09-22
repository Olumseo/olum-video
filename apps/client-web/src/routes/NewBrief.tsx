/**
 * Asking for a video.
 *
 * Two fields. That is the whole product promise — you write a sentence, a
 * person turns it into something you would have needed a camera and a day for
 * — so the form should feel like writing a note, not filing a request.
 *
 * Deliberately NOT a multi-step wizard. Everything a wizard would collect
 * (tone, audience, brand) is already in the client's dossier and gets attached
 * automatically; asking again would be asking someone to repeat themselves to
 * a system that already knows.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, NotReadyError, QuotaError } from "@olum-video/api-client";
import { Reveal } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

const EXAMPLES = [
  "Explain our new pricing and why we changed it.",
  "Answer the question we get asked most on sales calls.",
  "A short hiring post for a senior engineer.",
  "Walk through what shipped this week.",
];

export default function NewBrief() {
  const navigate = useNavigate();
  const { data: entitlement } = useAsync(() => api.getEntitlement());

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const outOfQuota =
    entitlement != null && entitlement.videos_used_today >= entitlement.daily_video_limit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBlocked(false);
    setSubmitting(true);
    try {
      const brief = await api.createBrief({ title: title.trim(), prompt: prompt.trim() });
      navigate(`/briefs/${brief.id}`);
    } catch (err) {
      if (err instanceof NotReadyError) {
        // Not a failure — a step is outstanding. Send them to the page that
        // can actually help rather than showing a red box on this one.
        setBlocked(true);
        setError(err.message);
      } else if (err instanceof QuotaError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Couldn't send that. Try again?");
      }
      // Only re-enable on failure: on success we navigate away, and clearing
      // this mid-transition leaves a live button long enough for a second
      // click to cost a second video.
      setSubmitting(false);
    }
  }

  const canSubmit = title.trim().length > 0 && prompt.trim().length > 0 && !outOfQuota;

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">New video</p>
        <h1 className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)] leading-[1.12] tracking-tight">
          What should it be about?
        </h1>
        <p className="mt-4 max-w-readable text-[15px] leading-relaxed text-muted">
          Write it the way you&rsquo;d explain it to someone across a desk. We&rsquo;ll turn it
          into a script, check it against everything we know about you, and send it back for
          your approval before anything is filmed.
        </p>
      </Reveal>

      {outOfQuota && entitlement && (
        <Reveal delay={60}>
          <div className="mt-8 rounded-card border border-accent-ink/30 bg-accent/10 px-5 py-4">
            <p className="text-[14px] text-ink">
              That&rsquo;s today&rsquo;s video used ({entitlement.videos_used_today} of{" "}
              {entitlement.daily_video_limit}).
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Your allowance comes back at midnight, your time. You can still write this one
              out — you just can&rsquo;t send it until then.
            </p>
          </div>
        </Reveal>
      )}

      <Reveal delay={80}>
        <form onSubmit={submit} className="mt-10 space-y-8">
          <div>
            <label
              htmlFor="title"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              Give it a name
            </label>
            <p className="mt-1 text-[13px] text-muted">
              Just so you can find it later. It isn&rsquo;t spoken.
            </p>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q3 pricing update"
              className="mt-3 w-full border-0 border-b border-subtle bg-transparent pb-3 font-display text-[clamp(1.1rem,2.6vw,1.5rem)] text-ink placeholder:text-muted/50 focus:border-ink focus:outline-none focus:ring-0 transition-colors duration-500 ease-luxe"
            />
          </div>

          <div>
            <label
              htmlFor="prompt"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              What do you want to say?
            </label>
            <textarea
              id="prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="We've changed how our pricing works — three tiers instead of five, and the middle one now includes…"
              className="mt-3 w-full resize-y rounded-card border border-subtle bg-paper px-5 py-4 text-[15px] leading-relaxed text-ink placeholder:text-muted/50 transition-colors duration-500 ease-luxe focus:border-ink focus:outline-none"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                or try
              </span>
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-subtle px-3 py-1.5 text-[12px] text-muted transition-colors duration-300 hover:border-ink/30 hover:text-ink"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              className={`rounded-card px-5 py-4 ${
                blocked
                  ? "border border-accent-ink/30 bg-accent/10"
                  : "border border-danger-ink/30 bg-danger/10"
              }`}
            >
              <p className="text-[14px] text-ink">{error}</p>
              {blocked && (
                <a
                  href="/video/setup"
                  className="mt-2 inline-block link-underline text-[13px] text-ink"
                >
                  Finish setting up
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {submitting ? "Sending…" : "Send it to the studio"}
              {!submitting && <span aria-hidden>&rarr;</span>}
            </button>
            {entitlement && !outOfQuota && (
              <p className="text-[13px] text-muted">
                {entitlement.daily_video_limit - entitlement.videos_used_today} left today
              </p>
            )}
          </div>
        </form>
      </Reveal>
    </div>
  );
}
