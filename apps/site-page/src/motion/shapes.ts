/**
 * The four shapes the hero morphs through — the product explained without a
 * word of copy.
 *
 *   you    → a portrait inside a capture ring   ("we record you once")
 *   prompt → a message bubble with a caret      ("you type what to say")
 *   review → a film frame with a tick           ("a person cuts every one")
 *   many   → twelve frames in a grid            ("a finished video, daily")
 *
 * Everything is STROKED, never filled. A filled silhouette turns the cloud
 * into a solid blob where individual particles stop being legible; an outline
 * keeps the cloud reading as thousands of separate points tracing a contour,
 * which is the whole effect. It also spreads a fixed particle budget over a
 * much longer path, so the density stays even between a single portrait and a
 * twelve-cell grid.
 *
 * All coordinates are fractions of `size`, so the shapes are resolution
 * independent and the sampler can rasterise them at whatever it likes.
 */

import type { DrawShape } from "./pointCloud";

/** Stroke weight as a fraction of the raster, for shapes with large features. */
const BOLD = 0.016;
/** Stroke weight for the dense grid, where BOLD would close the gaps up. */
const FINE = 0.010;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** 01 — a bust inside a capture ring: the one recording you ever make. */
export const drawYou: DrawShape = (ctx, s) => {
  ctx.lineWidth = s * BOLD;

  // Capture ring. It is not decoration: it is a long continuous contour, so
  // it carries a big share of the particles and gives the pointer ripple a
  // smooth curve to deform. Without it the cursor has almost nothing to push
  // against in this stage.
  ctx.beginPath();
  ctx.arc(s * 0.5, s * 0.5, s * 0.435, 0, Math.PI * 2);
  ctx.stroke();

  // Head.
  ctx.beginPath();
  ctx.arc(s * 0.5, s * 0.375, s * 0.145, 0, Math.PI * 2);
  ctx.stroke();

  // Shoulders, drawn as an open arc rather than a closed body: the ring
  // already supplies the outer silhouette, and closing this too made the
  // figure read as a keyhole.
  ctx.beginPath();
  ctx.moveTo(s * 0.215, s * 0.86);
  ctx.bezierCurveTo(s * 0.225, s * 0.65, s * 0.34, s * 0.565, s * 0.5, s * 0.565);
  ctx.bezierCurveTo(s * 0.66, s * 0.565, s * 0.775, s * 0.65, s * 0.785, s * 0.86);
  ctx.stroke();
};

/** 02 — a message bubble: the prompt you send instead of setting up a camera. */
export const drawPrompt: DrawShape = (ctx, s) => {
  ctx.lineWidth = s * BOLD;

  roundedRect(ctx, s * 0.115, s * 0.235, s * 0.77, s * 0.46, s * 0.075);
  ctx.stroke();

  // Tail. Three strokes rather than a closed triangle — a filled tail at this
  // scale is a solid wedge of particles hanging off an otherwise clean outline.
  ctx.beginPath();
  ctx.moveTo(s * 0.215, s * 0.695);
  ctx.lineTo(s * 0.185, s * 0.805);
  ctx.lineTo(s * 0.305, s * 0.695);
  ctx.stroke();

  // Three lines of typed text, ragged like real writing.
  const lines: [number, number][] = [
    [0.195, 0.72],
    [0.195, 0.79],
    [0.195, 0.47],
  ];
  lines.forEach(([x0, x1], i) => {
    const y = s * (0.355 + i * 0.1);
    ctx.beginPath();
    ctx.moveTo(s * x0, y);
    ctx.lineTo(s * x1, y);
    ctx.stroke();
  });

  // Caret, sitting just past the last line.
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.515);
  ctx.lineTo(s * 0.5, s * 0.6);
  ctx.stroke();
};

/** 03 — a film frame with a tick: nothing reaches you unreviewed. */
export const drawReview: DrawShape = (ctx, s) => {
  ctx.lineWidth = s * BOLD;

  roundedRect(ctx, s * 0.105, s * 0.235, s * 0.79, s * 0.53, s * 0.055);
  ctx.stroke();

  // Sprocket holes down both edges — the detail that makes a rectangle read
  // as film rather than as a card.
  ctx.lineWidth = s * FINE;
  for (let i = 0; i < 4; i++) {
    const y = s * (0.315 + i * 0.125);
    [0.155, 0.805].forEach((x) => {
      roundedRect(ctx, s * x, y, s * 0.04, s * 0.055, s * 0.012);
      ctx.stroke();
    });
  }

  // The tick, inside the frame.
  ctx.lineWidth = s * BOLD;
  ctx.beginPath();
  ctx.moveTo(s * 0.4, s * 0.505);
  ctx.lineTo(s * 0.47, s * 0.585);
  ctx.lineTo(s * 0.615, s * 0.415);
  ctx.stroke();
};

/** 04 — twelve frames: one recording, a video every day. */
export const drawMany: DrawShape = (ctx, s) => {
  ctx.lineWidth = s * FINE;

  const cols = 4;
  const rows = 3;
  const gap = s * 0.035;
  const left = s * 0.07;
  const top = s * 0.185;
  const cellW = (s * 0.86 - gap * (cols - 1)) / cols;
  const cellH = (s * 0.63 - gap * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = left + c * (cellW + gap);
      const y = top + r * (cellH + gap);
      roundedRect(ctx, x, y, cellW, cellH, s * 0.018);
      ctx.stroke();

      // A play triangle in each cell. Closed and stroked, so it stays an
      // outline like everything else.
      const cx = x + cellW * 0.5;
      const cy = y + cellH * 0.5;
      const t = Math.min(cellW, cellH) * 0.26;
      ctx.beginPath();
      ctx.moveTo(cx - t * 0.62, cy - t);
      ctx.lineTo(cx + t * 0.88, cy);
      ctx.lineTo(cx - t * 0.62, cy + t);
      ctx.closePath();
      ctx.stroke();
    }
  }
};

/** A stage is a shape, the words it stands in for, and the colour it wears. */
export type Stage = {
  key: string;
  index: string;
  draw: DrawShape;
  title: string;
  body: string;
  /**
   * Token name of the hue the cloud takes in this stage.
   *
   * Colour carries the sequence as much as shape does: the cloud crosses from
   * one hue to the next on the same curve it morphs on, so moving through the
   * steps is a visible warm-to-cool journey. Terracotta opens it because stage
   * one is *you* — the brand colour is spent on the person, not on a feature.
   */
  hue: string;
};

export const STAGES: Stage[] = [
  {
    key: "you",
    hue: "--accent-rgb",
    index: "01",
    draw: drawYou,
    title: "You sit down once.",
    body: "A single consent session captures your face and your voice. That recording becomes your digital twin — and it is the last time you have to be on camera.",
  },
  {
    key: "prompt",
    hue: "--indigo-rgb",
    index: "02",
    draw: drawPrompt,
    title: "Then you just type.",
    body: "Send a prompt and we write the script, or paste the script you already have. No camera, no lighting, no second take.",
  },
  {
    key: "review",
    hue: "--teal-rgb",
    index: "03",
    draw: drawReview,
    title: "A person cuts every one.",
    body: "Nothing generated reaches you untouched. Our editors review, trim and finish each video before it lands in your inbox — two revisions included.",
  },
  {
    key: "many",
    hue: "--violet-rgb",
    index: "04",
    draw: drawMany,
    title: "A finished video. Daily.",
    body: "Approve it and it publishes to your channels. One recording, on camera every day, without ever setting one up again.",
  },
];
