import type { ReactNode } from "react";

export type Tone = "neutral" | "progress" | "attention" | "good" | "bad";

const TONES: Record<Tone, string> = {
  neutral: "border-subtle bg-cream text-muted",
  progress: "border-subtle bg-warm text-ink",
  attention: "border-accent/40 bg-accent/10 text-accent",
  good: "border-success/30 bg-success/10 text-success",
  bad: "border-danger/30 bg-danger/10 text-danger",
};

/**
 * A status pill.
 *
 * Tone is passed in rather than derived from the label, because the same words
 * mean different things in different places — "queued" is reassuring to a
 * client and urgent to an editor.
 */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
