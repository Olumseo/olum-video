/**
 * "Create my AI clone": the sign-up form every call to action on the site
 * leads to.
 *
 * The app is not open for self-serve yet, so this is not an account. A
 * visitor leaves their name, email and phone, proves they own BOTH — one code
 * emailed, one texted — and our team calls them. Nothing is saved until both
 * codes match; see video-service/internal/signup.
 *
 * THREE SCREENS, ONE CARD
 * -----------------------
 * Details → codes → done, in the same card, with the step shown above it. A
 * separate page per step would reset the scroll and lose the visitor's sense
 * of how much is left; three fields and two codes are not worth navigating.
 */

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import examples from "libphonenumber-js/mobile/examples";

const API = "/api/v1/video/public/signups";

/**
 * Every country, worldwide.
 *
 * The codes and the rules for what a valid number looks like come from
 * libphonenumber-js — Google's libphonenumber metadata, the same data Android
 * uses to format numbers — so nothing here is a hand-kept list that falls out
 * of date. Names come from the browser's own `Intl.DisplayNames`, in the
 * visitor's language. Sorted by name; opens on India (see defaultCountry).
 */
const regionNames = new Intl.DisplayNames([navigator.language, "en"], { type: "region" });

const COUNTRIES = getCountries()
  .map((iso) => ({
    iso,
    dial: `+${getCountryCallingCode(iso)}`,
    name: regionNames.of(iso) ?? iso,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * India, always — the main market.
 *
 * NOT guessed from the browser's language: most browsers everywhere report
 * "en-US", and a guess that lands on the wrong country is worse than none —
 * an Indian number typed under +44 is still a VALID UK number, so it passes
 * every check and texts the code to a stranger's phone. Anyone elsewhere picks
 * their country, which they can see right beside the number.
 */
function defaultCountry(): CountryCode {
  return "IN";
}

/** The plans, as the pricing page names them. "" is "not sure yet". */
const PLANS = [
  { id: "premium_video", name: "Premium Video" },
  { id: "ultimate", name: "Ultimate" },
] as const;
type PlanChoice = "" | (typeof PLANS)[number]["id"];

type Started = {
  id: string;
  email_hint: string;
  phone_hint: string;
  resend_after_seconds: number;
  dev_email_code?: string;
  dev_phone_code?: string;
};

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Something went wrong. Please try again.",
    );
  }
  return data as T;
}

export default function GetStarted() {
  const [step, setStep] = useState<"details" | "codes" | "done">("details");
  const [started, setStarted] = useState<Started | null>(null);
  const [firstName, setFirstName] = useState("");

  return (
    <div className="relative isolate overflow-hidden px-6 pb-28 pt-36 lg:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(46% 40% at 10% 8%, rgb(var(--flare-rgb)/0.12), transparent 68%), radial-gradient(50% 44% at 92% 30%, rgb(var(--indigo-rgb)/0.11), transparent 70%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        {/* ── Left: what happens ──────────────────────────────────────────── */}
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
              Create my AI clone
            </p>
          </Reveal>
          <RevealLines
            as="h1"
            className="mt-6 font-serif text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.05] tracking-tight"
            lines={["Tell us who you are.", <span className="text-spectrum">We'll take it from there.</span>]}
          />
          <Reveal delay={200}>
            <p className="mt-6 max-w-readable text-[15px] leading-relaxed text-muted">
              Leave your details and confirm them with two quick codes. Someone from our team will
              contact you to set up your account and book the one recording your AI clone is built
              from.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <ol className="mt-10 space-y-5">
              {[
                ["Your details", "Name, email and phone — nothing else."],
                ["Two codes", "One by email, one by text, so we know it's really you."],
                ["We call you", "A person from our team, not a bot, to get you started."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-subtle bg-paper font-mono text-[11px] text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] text-ink">{title}</p>
                    <p className="mt-0.5 text-[13.5px] text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        {/* ── Right: the card ─────────────────────────────────────────────── */}
        <Reveal delay={140}>
          <div className="rounded-panel border border-subtle bg-paper/90 p-6 shadow-[0_40px_90px_-50px_rgb(var(--ink-rgb)/0.55)] backdrop-blur-sm sm:p-9">
            <span aria-hidden className="mb-7 block h-px w-full bg-spectrum opacity-70" />
            <Steps step={step} />

            {step === "details" && (
              <DetailsForm
                onStarted={(s, name) => {
                  setStarted(s);
                  setFirstName(name);
                  setStep("codes");
                }}
              />
            )}
            {step === "codes" && started && (
              <CodesForm
                started={started}
                onResent={setStarted}
                onBack={() => setStep("details")}
                onDone={(name) => {
                  setFirstName(name || firstName);
                  setStep("done");
                }}
              />
            )}
            {step === "done" && <Done name={firstName} />}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function Steps({ step }: { step: "details" | "codes" | "done" }) {
  const order = ["details", "codes", "done"] as const;
  const at = order.indexOf(step);
  return (
    <ol className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
      {["Details", "Verify", "Done"].map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="h-px w-6 bg-ink/15" />}
          <span
            className={`flex items-center gap-1.5 ${i <= at ? "text-ink" : "text-muted"}`}
            aria-current={i === at ? "step" : undefined}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${i < at ? "bg-success-ink" : i === at ? "bg-spectrum" : "bg-ink/20"}`}
            />
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-[12px] border border-subtle bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-muted/60 transition-colors focus:border-ink focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>}
    </label>
  );
}

function Problem({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-5 rounded-[12px] bg-flare/10 px-4 py-3 text-[13.5px] text-flare-ink">
      {text}
    </p>
  );
}

function DetailsForm({ onStarted }: { onStarted: (s: Started, firstName: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  // Arrives from the pricing page's "Choose …" buttons; editable here.
  const [params] = useSearchParams();
  const [plan, setPlan] = useState<PlanChoice>(() => {
    const p = params.get("plan");
    return PLANS.some((x) => x.id === p) ? (p as PlanChoice) : "";
  });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProblem(null);
    setBusy(true);
    try {
      // A number typed with its own "+" is read as international; otherwise
      // it is read as a number in the picked country. Checked against that
      // country's real numbering rules here, so a typo is caught before an
      // SMS is spent on it — the server still checks the result either way.
      const typed = phone.trim();
      const parsed = typed.startsWith("+")
        ? parsePhoneNumberFromString(typed)
        : parsePhoneNumberFromString(typed, country);
      if (!parsed?.isValid()) {
        const where = COUNTRIES.find((c) => c.iso === (parsed?.country ?? country))?.name;
        throw new Error(
          where
            ? `That doesn't look like a valid phone number in ${where}.`
            : "That doesn't look like a valid phone number.",
        );
      }
      const s = await post<Started>(API, { name, email, phone: parsed.number, note, plan });
      onStarted(s, name.trim().split(/\s+/)[0] ?? "");
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Plan" hint="We'll contact you and fix the price according to your needs.">
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanChoice)}
          className={inputClass}
        >
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="">Not sure yet</option>
        </select>
      </Field>
      <Field label="Your name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Maya Rao"
          required
        />
      </Field>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </Field>
      <Field label="Phone" hint="We'll text a code here, and call this number to get you started.">
        <div className="mt-1.5 flex gap-2">
          {/* Native <select>: every phone and screen reader already knows how
              to operate it, and typing a letter jumps to that country. The
              code leads each option so it stays visible when the closed box
              truncates a long name. */}
          <select
            aria-label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="w-[8.5rem] shrink-0 rounded-[12px] border border-subtle bg-paper px-3 py-3 text-[15px] text-ink focus:border-ink focus:outline-none sm:w-[10rem]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.dial} {c.name}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass} mt-0`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel-national"
            // A real-shaped mobile number for the picked country.
            placeholder={getExampleNumber(country, examples)?.formatNational() ?? ""}
            required
          />
        </div>
      </Field>
      <Field label="What will your videos be about? (optional)">
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Daily AI news for founders, tips for my dental practice…"
        />
      </Field>

      <Problem text={problem} />

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 disabled:opacity-50"
      >
        {busy ? "Sending codes…" : "Send my codes"}
        {!busy && <span aria-hidden>→</span>}
      </button>
      <p className="text-center text-[12px] leading-relaxed text-muted">
        We use these details only to contact you about olum.video.
      </p>
    </form>
  );
}

function CodesForm({
  started,
  onResent,
  onBack,
  onDone,
}: {
  started: Started;
  onResent: (s: Started) => void;
  onBack: () => void;
  onDone: (firstName: string) => void;
}) {
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [wait, setWait] = useState(started.resend_after_seconds);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => first.current?.focus(), []);

  // The resend countdown. Restarts whenever a fresh set of codes arrives.
  useEffect(() => {
    setWait(started.resend_after_seconds);
    const t = window.setInterval(() => setWait((w) => (w > 0 ? w - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [started]);

  async function verify(e: FormEvent) {
    e.preventDefault();
    setProblem(null);
    setBusy(true);
    try {
      const r = await post<{ name: string }>(`${API}/${encodeURIComponent(started.id)}/verify`, {
        email_code: emailCode,
        phone_code: phoneCode,
      });
      onDone(r.name);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function resend() {
    setProblem(null);
    try {
      onResent(await post<Started>(`${API}/${encodeURIComponent(started.id)}/resend`, {}));
      setEmailCode("");
      setPhoneCode("");
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Couldn't resend.");
    }
  }

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

  return (
    <form onSubmit={verify} className="space-y-5" noValidate>
      <p className="text-[14.5px] leading-relaxed text-muted">
        We've sent two 6-digit codes. Enter both to confirm it's you.
      </p>

      {/* Local development with Mailpit running: both codes really were
          sent — into the mail catcher's inbox. `import.meta.env.DEV` is false
          in a production build, so the bundler drops this block entirely. */}
      {import.meta.env.DEV && !started.dev_email_code && (
        <p className="rounded-[12px] border border-dashed border-indigo-ink/40 bg-indigo/5 px-4 py-3 font-mono text-[12px] text-indigo-ink">
          local testing — both codes are in Mailpit:{" "}
          <a href="http://localhost:8025" target="_blank" rel="noopener noreferrer" className="underline">
            localhost:8025
          </a>
        </p>
      )}

      {/* Development only, without Mailpit: the server sends nothing and hands
          the codes back instead. A production server never includes these. */}
      {started.dev_email_code && (
        <p className="rounded-[12px] border border-dashed border-accent-ink/40 bg-accent/5 px-4 py-3 font-mono text-[12px] text-accent-ink">
          dev mode — nothing was sent · email {started.dev_email_code} · phone{" "}
          {started.dev_phone_code}
        </p>
      )}

      <Field label="Email code" hint={`Sent to ${started.email_hint}`}>
        <input
          ref={first}
          className={`${inputClass} font-mono tracking-[0.4em]`}
          value={emailCode}
          onChange={(e) => setEmailCode(digits(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
        />
      </Field>
      <Field label="Phone code" hint={`Texted to ${started.phone_hint}`}>
        <input
          className={`${inputClass} font-mono tracking-[0.4em]`}
          value={phoneCode}
          onChange={(e) => setPhoneCode(digits(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
        />
      </Field>

      <Problem text={problem} />

      <button
        type="submit"
        disabled={busy || emailCode.length !== 6 || phoneCode.length !== 6}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 disabled:opacity-40"
      >
        {busy ? "Checking…" : "Confirm"}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <button type="button" onClick={onBack} className="link-underline text-muted hover:text-ink">
          ← Change my details
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0}
          className="text-ink disabled:text-muted"
        >
          {wait > 0 ? `Resend codes in ${wait}s` : "Resend codes"}
        </button>
      </div>
    </form>
  );
}

function Done({ name }: { name: string }) {
  return (
    <div role="status" className="py-4 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-ink text-paper">
        <svg width="18" height="15" viewBox="0 0 12 10" aria-hidden fill="none">
          <path d="M1 5.2 4.3 8.5 11 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 className="mt-6 font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-tight">
        Thanks{name ? `, ${name}` : ""}. You're verified.
      </h2>
      <p className="mx-auto mt-3 max-w-[40ch] text-[15px] leading-relaxed text-muted">
        Your details are captured. Our team will contact you shortly to get your AI clone started.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/results"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-colors hover:bg-accent-2"
        >
          See what we make
          <span aria-hidden>→</span>
        </Link>
        <Link to="/" className="rounded-full border border-subtle px-6 py-3 text-sm hover:bg-cream">
          Back to home
        </Link>
      </div>
    </div>
  );
}
