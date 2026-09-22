/**
 * The screen a client lands on between paying and being able to make anything.
 *
 * Getting set up takes a person a day or two: someone creates the mailbox and
 * the studio account, the client checks it, then an executive records the
 * digital twin. A spinner and "please wait" would be the honest minimum and a
 * terrible experience — the client has paid, nothing is visibly happening, and
 * they cannot tell whether they have been forgotten.
 *
 * So this page does three things instead, and each earns its space:
 *
 *   1. Names the ONE thing being waited on right now, in a sentence.
 *   2. Shows the whole path, so "where am I" and "how much is left" are
 *      answerable at a glance rather than inferred from a progress bar.
 *   3. Gives them the one action that is theirs to take, when there is one —
 *      confirming the setup, or asking for the twin.
 *
 * It reads the server's `blocker` rather than deriving its own. Two
 * implementations of the same gate drift, and the failure is a button this page
 * offers that the API then refuses.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, isMockApi, setMockReadiness, type Blocker, type Readiness } from "@olum-video/api-client";
import { Reveal } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/**
 * The path, in the order the client walks it.
 *
 * `blocker` is the server's code for "this is the step that is waiting", which
 * is what ties a row to the API's answer instead of to a guess made here.
 */
const STEPS: {
  blocker: Exclude<Blocker, "" | "no_entitlement">;
  label: string;
  detail: string;
  /** Who moves this one forward. Shown so nobody waits on the wrong party. */
  who: "us" | "you";
}[] = [
  {
    blocker: "awaiting_managed_email",
    label: "Your video mailbox",
    detail: "We create an olum address that your studio account is registered to.",
    who: "us",
  },
  {
    blocker: "awaiting_provider_account",
    label: "Studio account",
    detail: "The account your avatar and voice will live in.",
    who: "us",
  },
  {
    blocker: "awaiting_provider_verification",
    label: "Verification",
    detail: "We confirm the account is live and working.",
    who: "us",
  },
  {
    blocker: "awaiting_client_confirmation",
    label: "Your check",
    detail: "You look over what we set up and confirm it's right.",
    who: "you",
  },
  {
    blocker: "awaiting_digital_twin",
    label: "Your digital twin",
    detail: "One recording session. Everything after that is written, not filmed.",
    who: "you",
  },
];

/** Which flag on the readiness payload proves a step is finished. */
const DONE_FLAG: Record<(typeof STEPS)[number]["blocker"], keyof Readiness> = {
  awaiting_managed_email: "email_created",
  awaiting_provider_account: "provider_created",
  awaiting_provider_verification: "provider_verified",
  awaiting_client_confirmation: "client_confirmed",
  awaiting_digital_twin: "twin_ready",
};

export default function Setup() {
  const [params] = useSearchParams();

  // Fixtures default to a fully onboarded client, because that is the screen
  // most people look at. `?state=` reaches the half-finished ones, which are
  // the interesting layouts and otherwise need a backend to see.
  if (isMockApi) {
    const demo = params.get("state");
    if (demo) setMockReadiness(demo as Blocker);
  }

  const { data, error, loading, retry } = useAsync(() => api.getReadiness());

  if (loading) return <SetupSkeleton />;
  if (error || !data) {
    return (
      <p className="py-24 text-center text-sm text-muted">
        We couldn&rsquo;t load your setup just now.{" "}
        <button onClick={retry} className="link-underline text-ink">
          Try again
        </button>
      </p>
    );
  }

  const activeIndex = STEPS.findIndex((s) => s.blocker === data.blocker);

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Setting you up
        </p>
        <h1 className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)] leading-[1.12] tracking-tight">
          {data.blocker === "no_entitlement"
            ? "Video isn't on your plan yet"
            : "Almost there."}
        </h1>
        <p className="mt-4 max-w-readable text-[15px] leading-relaxed text-muted">
          {data.message ||
            "Everything's ready. You can start making videos whenever you like."}
        </p>
      </Reveal>

      {data.blocker === "no_entitlement" ? (
        <Reveal delay={80}>
          <div className="mt-10">
            <a
              href="/video/welcome/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-colors duration-500 ease-luxe hover:bg-accent-2"
            >
              See plans
              <span aria-hidden>&rarr;</span>
            </a>
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal delay={80}>
            <ol className="mt-12 space-y-px">
              {STEPS.map((step, i) => (
                <Step
                  key={step.blocker}
                  index={i}
                  step={step}
                  state={
                    data[DONE_FLAG[step.blocker]]
                      ? "done"
                      : i === activeIndex
                        ? "active"
                        : "waiting"
                  }
                />
              ))}
            </ol>
          </Reveal>

          <Reveal delay={160}>
            <Action readiness={data} onDone={retry} />
          </Reveal>
        </>
      )}
    </div>
  );
}

/**
 * One row of the path.
 *
 * The three states are told apart by more than colour: a finished step has a
 * tick, the current one has a filled spectrum marker and a lifted surface, and
 * a future one is flat with a hollow ring. Colour alone would leave the whole
 * screen unreadable to anyone who cannot separate the hues — and this is the
 * screen that explains what is happening.
 */
function Step({
  index,
  step,
  state,
}: {
  index: number;
  step: (typeof STEPS)[number];
  state: "done" | "active" | "waiting";
}) {
  return (
    <li
      className={`row-enter flex gap-4 rounded-card border px-5 py-4 transition-colors duration-500 ease-luxe ${
        state === "active"
          ? "border-subtle bg-paper shadow-[0_18px_40px_-30px_rgb(var(--ink-rgb)/0.45)]"
          : "border-transparent"
      }`}
      style={{ "--row-delay": `${index * 55}ms` } as React.CSSProperties}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
        {state === "done" ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-ink">
            <svg viewBox="0 0 12 10" aria-hidden className="h-2.5 w-2.5 fill-none stroke-paper">
              <path d="M1 5.2 4.3 8.5 11 1.6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : state === "active" ? (
          // The spectrum marker appears exactly once per screen: on the step
          // being waited on. Using it anywhere else would stop it meaning
          // "here".
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span aria-hidden className="pulse-dot absolute inset-0 rounded-full bg-spectrum opacity-25" />
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-spectrum" />
          </span>
        ) : (
          <span aria-hidden className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/20" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2
            className={`text-[15px] ${
              state === "waiting" ? "text-muted" : "text-ink"
            }`}
          >
            {step.label}
          </h2>
          {state === "active" && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-ink">
              {step.who === "you" ? "over to you" : "in progress"}
            </span>
          )}
          {state === "done" && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-success-ink">
              done
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{step.detail}</p>
      </div>
    </li>
  );
}

/**
 * The one thing the client can do right now, if anything.
 *
 * Rendered as a distinct dark panel rather than a button in the list, because
 * the list is a status display and this is an input. Mixing the two teaches
 * people to look for controls among things that are only information.
 */
function Action({ readiness, onDone }: { readiness: Readiness; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>, after?: string) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      if (after) setNote(after);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again?");
    } finally {
      setBusy(false);
    }
  }

  if (readiness.blocker === "awaiting_client_confirmation") {
    return (
      <Panel
        kicker="Your turn"
        heading="Does this look right?"
        body="We've created your mailbox and your studio account. Have a look, and tell us if anything's off — it goes straight back to the person who set it up."
      >
        {rejecting ? (
          <div className="w-full">
            <label htmlFor="reason" className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">
              What&rsquo;s wrong?
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="The name is spelled wrong…"
              className="mt-2 w-full resize-y rounded-[12px] border border-paper/20 bg-paper/5 px-4 py-3 text-[14px] text-paper placeholder:text-paper/35 focus:border-paper/40 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                disabled={busy || reason.trim().length === 0}
                onClick={() => run(() => api.confirmSetup({ confirmed: false, reason }))}
                className="rounded-full bg-paper px-5 py-2.5 text-sm text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Send it back
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="rounded-full px-5 py-2.5 text-sm text-paper/70 transition-colors hover:text-paper"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => run(() => api.confirmSetup({ confirmed: true }))}
              className="rounded-full bg-paper px-6 py-3 text-sm text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Confirming…" : "Yes, that's right"}
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="rounded-full px-6 py-3 text-sm text-paper/70 ring-1 ring-inset ring-paper/25 transition-colors hover:text-paper"
            >
              Something&rsquo;s wrong
            </button>
          </div>
        )}
        {error && <p className="mt-3 w-full text-[13px] text-flare">{error}</p>}
      </Panel>
    );
  }

  if (readiness.blocker === "awaiting_digital_twin") {
    return (
      <Panel
        kicker="Your turn"
        heading="Let's record your twin."
        body="One session, about twenty minutes, and you never need a camera again. An executive will get in touch to arrange it."
      >
        <button
          disabled={busy}
          onClick={() =>
            run(() => api.requestTwin(), "Asked. Someone will be in touch shortly.")
          }
          className="rounded-full bg-paper px-6 py-3 text-sm text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Asking…" : note ? "Requested" : "Request my twin"}
        </button>
        {note && <p className="mt-3 w-full text-[13px] text-paper/70">{note}</p>}
        {error && <p className="mt-3 w-full text-[13px] text-flare">{error}</p>}
      </Panel>
    );
  }

  // Everything outstanding is ours. Say who is doing it and stop there —
  // inventing a completion time we have not committed to would be worse than
  // saying nothing.
  return (
    <div className="mt-12 rounded-card border border-subtle bg-cream/50 px-6 py-5">
      <p className="text-[14px] leading-relaxed text-ink">
        Nothing for you to do right now — we&rsquo;re on it.
      </p>
      <p className="mt-1 text-[13px] text-muted">
        We&rsquo;ll email you the moment it&rsquo;s your turn.
      </p>
    </div>
  );
}

/**
 * The dark call-to-action surface.
 *
 * The same near-black panel the marketing site uses for its showcase, which is
 * what makes this read as part of olum.video rather than as a generic form.
 */
function Panel({
  kicker,
  heading,
  body,
  children,
}: {
  kicker: string;
  heading: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-12 overflow-hidden rounded-panel bg-panel px-7 py-8 text-paper shadow-[0_40px_80px_-50px_rgb(var(--ink-rgb)/0.8)] sm:px-9 sm:py-10">
      <span aria-hidden className="mb-7 block h-px w-full bg-spectrum opacity-70" />
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/55">{kicker}</p>
      <h2 className="mt-3 font-display text-[clamp(1.4rem,3.2vw,2rem)] leading-tight">{heading}</h2>
      <p className="mt-3 max-w-readable text-[14px] leading-relaxed text-paper/70">{body}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="h-3 w-28 rounded bg-warm" />
      <div className="mt-5 h-10 w-2/3 rounded bg-warm" />
      <div className="mt-4 h-4 w-1/2 rounded bg-warm/70" />
      <ul className="mt-12 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex gap-4">
            <span className="h-5 w-5 shrink-0 rounded-full bg-warm" />
            <span className="h-4 flex-1 rounded bg-warm/70" style={{ maxWidth: `${70 - i * 8}%` }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
