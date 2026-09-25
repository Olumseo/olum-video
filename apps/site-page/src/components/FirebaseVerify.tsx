/**
 * The Firebase verification step of the sign-up form.
 *
 *   1. Phone: Firebase texts a code; the visitor types it here.
 *   2. Email: Firebase emails a link; this card waits, polling video-service,
 *      and finishes by itself the moment the link is opened — in this tab,
 *      another tab, or on the visitor's phone.
 *
 * Each step's proof is a Firebase ID token handed to video-service, which
 * checks it against the Firebase project and against the details the visitor
 * typed. Nothing here is trusted on its own say-so.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ConfirmationResult } from "firebase/auth";

import { LINK_KEY } from "../lib/signupLink";

const API = "/api/v1/video/public/signups";

type Flow = typeof import("../lib/firebaseFlow");

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

type Confirmed = { status: "captured" | "pending"; name?: string };

export function FirebaseVerify({
  id,
  phone,
  email,
  phoneHint,
  emailHint,
  onBack,
  onDone,
}: {
  id: string;
  phone: string;
  email: string;
  phoneHint: string;
  emailHint: string;
  onBack: () => void;
  onDone: (firstName: string) => void;
}) {
  const [stage, setStage] = useState<"sending" | "code" | "email">("sending");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [emulator, setEmulator] = useState(false);
  const flow = useRef<Flow | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  async function sendSms() {
    setProblem(null);
    setStage("sending");
    try {
      flow.current ??= await import("../lib/firebaseFlow");
      setEmulator(flow.current.firebaseEmulator);
      confirmation.current = await flow.current.sendPhoneCode(phone, anchor.current!);
      setStage("code");
    } catch (err) {
      setProblem(flow.current ? flow.current.explain(err) : "Couldn't load verification.");
      setStage("code");
    }
  }

  // Send the SMS once. The ref stops React's development double-mount from
  // texting the visitor twice.
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void sendSms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmCode(e: FormEvent) {
    e.preventDefault();
    if (!flow.current || !confirmation.current) return;
    setProblem(null);
    setBusy(true);
    try {
      const proof = await flow.current.confirmPhoneCode(confirmation.current, code);
      let r: Confirmed;
      try {
        r = await post<Confirmed>(`${API}/${encodeURIComponent(id)}/confirm`, { id_token: proof.token });
      } finally {
        // After video-service has the token, never before — and whether or
        // not the request worked, so no throwaway Firebase user is left.
        await proof.discard();
      }
      if (r.status === "captured") {
        onDone(r.name ?? "");
        return;
      }
      // Phone proven. Now the email link.
      const returnTo = `${window.location.origin}${import.meta.env.BASE_URL}get-started?signup=${encodeURIComponent(id)}`;
      await flow.current.sendEmailLink(email, returnTo);
      try {
        localStorage.setItem(LINK_KEY, JSON.stringify({ id, email }));
      } catch {
        /* private mode: the link tab will ask for the email instead */
      }
      setStage("email");
    } catch (err) {
      setProblem(flow.current.explain(err));
    } finally {
      setBusy(false);
    }
  }

  // Waiting on the email link: ask video-service whether it has been opened.
  //
  // Polling goes through olum.ai's shared api-gateway, so it stays cheap:
  // paused while this tab is hidden (the visitor is in their email app —
  // coming back checks at once), and stopped for good once the sign-up has
  // expired (410) or after 30 minutes, so an abandoned tab never polls forever.
  useEffect(() => {
    if (stage !== "email") return;
    const startedAt = Date.now();
    let stopped = false;
    const stop = (message?: string) => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (message) setProblem(message);
    };
    const check = async () => {
      if (stopped || document.hidden) return;
      if (Date.now() - startedAt > 30 * 60 * 1000) {
        stop("This sign-up has expired. Please start again.");
        return;
      }
      const res = await fetch(`${API}/${encodeURIComponent(id)}`).catch(() => null);
      if (stopped) return;
      if (res?.status === 410) {
        stop("This sign-up has expired. Please start again.");
        return;
      }
      const st = res && res.ok ? ((await res.json()) as { done: boolean; name: string }) : null;
      if (st?.done && !stopped) {
        stop();
        onDone(st.name);
      }
    };
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    const timer = window.setInterval(() => void check(), 3000);
    document.addEventListener("visibilitychange", onVisible);
    return () => stop();
  }, [stage, id, onDone]);

  async function resendEmail() {
    if (!flow.current) return;
    setProblem(null);
    try {
      const returnTo = `${window.location.origin}${import.meta.env.BASE_URL}get-started?signup=${encodeURIComponent(id)}`;
      await flow.current.sendEmailLink(email, returnTo);
      setProblem(null);
    } catch (err) {
      setProblem(flow.current.explain(err));
    }
  }

  return (
    <div className="space-y-5">
      {/* Firebase's invisible reCAPTCHA attaches here. */}
      <div ref={anchor} />

      {emulator && (
        <p className="rounded-[12px] border border-dashed border-indigo-ink/40 bg-indigo/5 px-4 py-3 font-mono text-[12px] text-indigo-ink">
          local testing — the SMS code and the email link are in the Firebase emulator:{" "}
          <a href="http://localhost:4000/auth" target="_blank" rel="noopener noreferrer" className="underline">
            localhost:4000/auth
          </a>
        </p>
      )}

      {stage !== "email" ? (
        <form onSubmit={confirmCode} className="space-y-5" noValidate>
          <p className="text-[14.5px] leading-relaxed text-muted">
            {stage === "sending"
              ? `Sending a code to ${phoneHint}…`
              : `We've texted a 6-digit code to ${phoneHint}.`}
          </p>
          <label className="block">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
              Phone code
            </span>
            <input
              className="mt-1.5 w-full rounded-[12px] border border-subtle bg-paper px-4 py-3 font-mono text-[15px] tracking-[0.4em] text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              disabled={stage === "sending"}
            />
          </label>
          {problem && (
            <p role="alert" className="rounded-[12px] bg-flare/10 px-4 py-3 text-[13.5px] text-flare-ink">
              {problem}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 disabled:opacity-40"
          >
            {busy ? "Checking…" : "Confirm phone"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <button type="button" onClick={onBack} className="link-underline text-muted hover:text-ink">
              ← Change my details
            </button>
            <button type="button" onClick={() => void sendSms()} className="text-ink">
              Send a new code
            </button>
          </div>
        </form>
      ) : (
        <div role="status" className="space-y-4">
          <p className="flex items-center gap-2 text-[14.5px] text-ink">
            <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-success-ink text-paper">
              ✓
            </span>
            Phone confirmed.
          </p>
          <p className="text-[14.5px] leading-relaxed text-muted">
            Last step: we&rsquo;ve emailed a link to <span className="text-ink">{emailHint}</span>.
            Open it — on this device or any other — and this page will finish by itself.
          </p>
          <p className="flex items-center gap-2 font-mono text-[12px] text-muted">
            <span aria-hidden className="pulse-dot h-1.5 w-1.5 rounded-full bg-spectrum" />
            Waiting for you to open the link…
          </p>
          {problem && (
            <p role="alert" className="rounded-[12px] bg-flare/10 px-4 py-3 text-[13.5px] text-flare-ink">
              {problem}
            </p>
          )}
          <button type="button" onClick={() => void resendEmail()} className="text-[13px] text-ink">
            Send the link again
          </button>
        </div>
      )}
    </div>
  );
}
