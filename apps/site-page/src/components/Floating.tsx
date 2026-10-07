/**
 * The two things that float over the page: a prompt in the bottom-right
 * corner, and a "Get started" bar along the bottom of a phone screen.
 *
 * Both step aside once the page's own ask is on screen — the home page's
 * closing section (`#start`), or the footer on pages without one. A floating
 * "Get started" sitting on top of the real "Get started" is just noise.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useScrolled } from "@olum-video/ui";

import { Cta } from "./Cta";

/** True once the page's own call to action is (nearly) on screen. */
function useNearAsk() {
  const { pathname } = useLocation();
  const [near, setNear] = useState(false);

  useEffect(() => {
    const check = () => {
      const target = document.getElementById("start") ?? document.querySelector("footer");
      setNear(!!target && target.getBoundingClientRect().top < window.innerHeight * 0.85);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [pathname]);

  return near;
}

/**
 * The phone bar. Only below `sm`, where the header has no room for its
 * "Get started" button, and only once the hero — which has its own — has
 * scrolled away.
 */
export function StickyBar() {
  const near = useNearAsk();
  const past = useScrolled(500);
  const show = past && !near;

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-[55] flex items-center justify-between gap-3 border-t border-subtle bg-paper/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 transition-[transform,visibility] duration-500 ease-luxe supports-[backdrop-filter]:bg-paper/80 supports-[backdrop-filter]:backdrop-blur-md sm:hidden ${
          show ? "visible translate-y-0" : "invisible translate-y-full"
        }`}
      >
        <p className="text-[12.5px] leading-tight text-muted">
          Daily AI videos,
          <br />
          zero effort.
        </p>
        <Cta to="/get-started" small arrow>
          Get started
        </Cta>
      </div>
      {/* Room for the bar, so it never sits on the footer's last line. */}
      <div aria-hidden className="h-[70px] sm:hidden" />
    </>
  );
}

/**
 * What the corner prompt says, in turn. Each one answers a different reason a
 * visitor has not acted yet: not seen it, not understood it, not priced it,
 * not been asked.
 */
const MESSAGES = [
  {
    tag: "Quick look",
    title: "See what one recording becomes.",
    text: "Watch real raw-vs-edited videos before you decide.",
    action: { label: "Watch sample videos", to: "/results" },
    aside: { label: "Or get started now", to: "/get-started" },
  },
  {
    tag: "How it works",
    title: "Four of five steps are not your job.",
    text: "You share videos. Olum does the rest, from ideas to posting.",
    action: { label: "See how it works", to: "/how-it-works" },
    aside: { label: "Skip to sign up", to: "/get-started" },
  },
  {
    tag: "Pricing",
    title: "A full content team, one plan.",
    text: "No retainer, no hiring. See what is included.",
    action: { label: "See pricing", to: "/pricing" },
    aside: { label: "Get started", to: "/get-started" },
  },
  {
    tag: "Ready?",
    title: "Send your first recording.",
    text: "Daily AI avatar videos, reviewed by a person before they go out.",
    action: { label: "Get started", to: "/get-started" },
    aside: { label: "Watch sample videos", to: "/results" },
  },
];

/**
 * How long after landing the card opens. Just long enough for the page to
 * paint first, so the card slides in rather than being there from frame one.
 */
const OPEN_ON_LAND_MS = 600;
const ROTATE_MS = 9000;
/** The card dips out for this long while its words change. */
const SWAP_MS = 400;

/**
 * The corner prompt.
 *
 * It opens as soon as the visitor lands — exactly as if they had pressed the
 * round button — and turns through the messages every nine seconds. Hovering
 * or focusing it holds the current one still: a card that changes under the
 * pointer is a card nobody can finish reading. The × or Escape closes it; the
 * round button brings it back at any time.
 */
export function Nudge() {
  const near = useNearAsk();
  const nearRef = useRef(near);
  nearRef.current = near;

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [held, setHeld] = useState(false);

  const visible = open && !swapping;
  const message = MESSAGES[index]!;

  // Open on landing, unless the visitor arrived already at the page's own ask.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!nearRef.current) setOpen(true);
    }, OPEN_ON_LAND_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Reaching the page's own ask puts it away.
  useEffect(() => {
    if (near) setOpen(false);
  }, [near]);

  // Turning through the messages, only while it is open and not being read.
  useEffect(() => {
    if (!open || held) return;
    let swap = 0;
    const timer = window.setInterval(() => {
      setSwapping(true);
      swap = window.setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setSwapping(false);
      }, SWAP_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(swap);
    };
  }, [open, held]);

  function close() {
    setOpen(false);
    setHeld(false);
  }

  // Escape closes it, as it would any panel that opened itself.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    if (open) close();
    else setOpen(true);
  }

  return (
    <aside
      aria-label="Get started with Olum"
      className="fixed bottom-[86px] right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
    >
      {/* `invisible` when closed, not just transparent: hidden links must not
          catch a Tab press. The transition delays the visibility flip until
          the fade has finished, so closing still animates. */}
      <div
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
        className={`relative w-[300px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[20px] border border-subtle bg-paper px-[18px] pb-4 pt-5 shadow-[0_24px_60px_-20px_rgb(var(--ink-rgb)/0.35)] transition-all duration-500 ease-luxe motion-reduce:transition-none ${
          visible
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible translate-y-3 scale-[0.97] opacity-0"
        }`}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-spectrum" />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-cream text-muted transition-colors hover:bg-warm hover:text-ink"
        >
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
            <path d="M1 1l8 8M9 1 1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <p className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
          {message.tag}
        </p>
        <p className="mt-2 pr-6 font-serif text-[24px] leading-[1.08] tracking-tight text-ink">
          {message.title}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{message.text}</p>

        <Cta
          to={message.action.to}
          small
          className="mt-4 w-full justify-center"
          onClick={close}
        >
          {message.action.label}
        </Cta>
        <Link
          to={message.aside.to}
          onClick={close}
          className="mt-2.5 block text-center text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          {message.aside.label}
        </Link>

        <span aria-hidden className="mt-3 flex justify-center gap-1.5">
          {MESSAGES.map((m, i) => (
            <span
              key={m.tag}
              className={`h-[5px] rounded-full transition-all duration-300 ${
                i === index ? "w-3.5 bg-ink" : "w-[5px] bg-ink/15"
              }`}
            />
          ))}
        </span>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Get daily videos"
        className="flex items-center gap-2.5 rounded-full bg-ink p-3.5 text-[13px] text-paper shadow-[0_12px_30px_-8px_rgb(var(--ink-rgb)/0.5)] transition-transform duration-300 ease-luxe hover:-translate-y-0.5 sm:py-3 sm:pl-3.5 sm:pr-[18px]"
      >
        <span aria-hidden className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-teal opacity-60 motion-safe:animate-ping" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-teal" />
        </span>
        <span className="hidden sm:inline">Get daily videos</span>
      </button>
    </aside>
  );
}
