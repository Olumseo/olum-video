/**
 * The four platform marks under the hero.
 *
 * They inherit `currentColor` — a single ink tone rather than each brand's own
 * colour. Four saturated logos in a row would out-shout the headline above
 * them, and the point of the row is "these are the destinations", not "look at
 * these logos". It also sidesteps the brand-guideline problem of recolouring
 * someone else's mark.
 */

import { PLATFORMS, type Platform } from "./platforms";

export function PlatformMark({ platform, size = 18 }: { platform: Platform; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d={platform.path} />
    </svg>
  );
}

/** The whole row, name beside each mark. */
export function PlatformRow({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className}`}>
      {PLATFORMS.map((platform) => (
        <li key={platform.name} className="flex items-center gap-2 text-ink">
          <PlatformMark platform={platform} />
          <span className="text-[13px] text-muted">{platform.name}</span>
        </li>
      ))}
    </ul>
  );
}
