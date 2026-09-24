/**
 * Every real clip on the site, in one place.
 *
 * DATA ONLY — no components. The showcase used to declare its clips inline,
 * and the moment a second page needed the same footage that became two lists
 * that had to agree about file names, runtimes and pixel dimensions. It is
 * also why this is a `.ts` and not a `.tsx`: a module that exports both data
 * and components breaks Fast Refresh, which bit us once already.
 *
 * WHAT IS CLAIMED HERE, AND WHY IT IS CLAIMED CAREFULLY
 * ------------------------------------------------------
 * These are real people's real videos on a public marketing page, so each set
 * says only what the footage itself supports:
 *
 *   • The sofa recording IS the consent take its two videos were generated
 *     from. That relationship was established with the footage.
 *   • The rooftop take is a RAW recording by the same person whose two
 *     finished videos sit beside it. It is not the literal take those two were
 *     cut from — they run longer and cover other subjects — so the copy says
 *     "a raw take" and "from the same setup", never "this became that".
 *   • The desk set has no raw counterpart in hand, so it claims none. It is
 *     presented as two finished videos and nothing more.
 *
 * Anything stronger would be a nicer sentence and a false one.
 *
 * ASSET URLS GO THROUGH `BASE_URL`, NEVER A BARE "/media/…"
 * ----------------------------------------------------------
 * This app is served from /video/welcome/ in production. A root-absolute path
 * would ask olum.ai's main SPA for a file it has never heard of and the tiles
 * would show posters that 404.
 *
 * `preview` is the split-screen stretch of each finished video — b-roll above,
 * the person below — found by eye from a frame-per-second contact sheet. It is
 * what repeats while a tile sits idle; see previewLoop.tsx.
 *
 * `width` and `height` are the ENCODED dimensions, read off the file. Every
 * frame on the site is built from them, so a stale pair does not merely look
 * wrong — it crops the subject's head off. Re-encode a file, re-read them.
 */

import type { Clip } from "./ShowcaseVideo";

const base = import.meta.env.BASE_URL;

/* ── 01 · the sofa recording, and what his twin generated from it ────────── */

export const SOFA_SOURCE: Clip = {
  id: "source",
  src: `${base}media/source-capture.mp4`,
  poster: `${base}media/source-capture.jpg`,
  caption: "The recording",
  label: "One sitting, one camera",
  duration: "0:33",
  alt: "The original consent recording: a man sitting on a sofa, talking to the camera in ordinary room light.",
  // Shot vertically on a phone. The stream probes as 1920x1080 because the
  // rotation is a metadata flag rather than pixels — these are the encoded
  // numbers, which are what the browser lays out from.
  width: 624,
  height: 1110,
  kind: "source",
};

export const SOFA_OUTPUTS: Clip[] = [
  {
    id: "astra",
    src: `${base}media/generated-astra.mp4`,
    poster: `${base}media/generated-astra.jpg`,
    caption: "Generated",
    label: "Benchmark explainer",
    duration: "0:57",
    alt: "A finished vertical video: the digital twin presents AI benchmark results, cut together with charts, b-roll and burned-in captions.",
    width: 480,
    height: 854,
    kind: "generated",
    preview: [0, 7],
  },
  {
    id: "agi",
    src: `${base}media/generated-agi.mp4`,
    poster: `${base}media/generated-agi.jpg`,
    caption: "Generated",
    label: "News reaction",
    duration: "1:00",
    alt: "A finished vertical video: the digital twin reacts to an industry announcement, cut together with screenshots, headlines and burned-in captions.",
    width: 480,
    height: 854,
    kind: "generated",
    preview: [20, 27],
  },
];

/* ── 02 · the rooftop take, and two finished videos from the same setup ──── */

export const ROOFTOP_SOURCE: Clip = {
  id: "rooftop-raw",
  src: `${base}media/creator-1-source.mp4`,
  poster: `${base}media/creator-1-source.jpg`,
  caption: "Raw take",
  label: "Straight off the phone",
  duration: "0:39",
  alt: "A raw recording: a woman seated at an outdoor table under a wooden roof, talking to the camera. No captions, no cuts, no b-roll.",
  // PORTRAIT. The phone stored this take as 1024x576 pixels plus a "rotate
  // 90°" flag, and the first encode forced it to 854x480 — squeezing a
  // vertical picture into a landscape box, so she came out stretched sideways.
  // Re-encoded from the original with the rotation applied: 480x854, same as
  // every other phone clip here.
  width: 480,
  height: 854,
  kind: "source",
};

export const ROOFTOP_OUTPUTS: Clip[] = [
  {
    id: "rooftop-work",
    src: `${base}media/creator-1-final-1.mp4`,
    poster: `${base}media/creator-1-final-1.jpg`,
    caption: "Edited",
    label: "AI at work",
    duration: "1:04",
    alt: "A finished vertical video about AI arriving in everyday work tools, cut together with product screenshots, news clips and burned-in captions.",
    width: 480,
    height: 854,
    kind: "edited",
    preview: [0, 8],
  },
  {
    id: "rooftop-voice",
    src: `${base}media/creator-1-final-2.mp4`,
    poster: `${base}media/creator-1-final-2.jpg`,
    caption: "Edited",
    label: "A medical breakthrough",
    duration: "0:55",
    alt: "A finished vertical video telling the story of a man who regained his voice through a brain implant, cut together with documentary footage and burned-in captions.",
    width: 480,
    height: 854,
    kind: "edited",
    preview: [0, 8],
  },
];

/* ── 03 · two finished videos, no raw counterpart in hand ────────────────── */

export const DESK_OUTPUTS: Clip[] = [
  {
    id: "desk-europe",
    src: `${base}media/creator-2-final-1.mp4`,
    poster: `${base}media/creator-2-final-1.jpg`,
    caption: "Edited",
    label: "Europe on alert",
    duration: "0:43",
    alt: "A finished vertical video about European defence preparations, cut together with news footage, maps and burned-in captions.",
    width: 480,
    height: 854,
    kind: "edited",
    preview: [0, 7],
  },
  {
    id: "desk-valuation",
    src: `${base}media/creator-2-final-2.mp4`,
    poster: `${base}media/creator-2-final-2.jpg`,
    caption: "Edited",
    label: "What an AI company is worth",
    duration: "0:51",
    alt: "A finished vertical video about the valuation of an AI company, cut together with headlines, charts and burned-in captions.",
    width: 480,
    height: 854,
    kind: "edited",
    preview: [0, 8],
  },
];

/** Everything that plays on /results, in the order it appears. */
export const ALL_RESULT_CLIPS: Clip[] = [
  SOFA_SOURCE,
  ...SOFA_OUTPUTS,
  ROOFTOP_SOURCE,
  ...ROOFTOP_OUTPUTS,
  ...DESK_OUTPUTS,
];
