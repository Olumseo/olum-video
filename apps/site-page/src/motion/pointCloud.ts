/**
 * Turns a drawing into a cloud of evenly-spaced particle targets.
 *
 * Every shape the hero morphs through is authored as a normal canvas drawing
 * — arcs, beziers, stroked rectangles — rather than as a hand-written list of
 * coordinates. We rasterise that drawing once into a small offscreen canvas,
 * read the pixels back, and keep the ones that were painted. Those pixels are
 * the candidate set.
 *
 * WHY THE SPACING MATTERS MORE THAN THE COUNT
 * -------------------------------------------
 * Picking candidates at random gives you a Poisson *process*, and a Poisson
 * process clumps: some points land almost on top of each other while other
 * stretches of the contour are bare. Rendered, that reads as ink spatter — a
 * scratchy, accidental-looking line. It was the single biggest thing separating
 * our first version from the reference.
 *
 * So candidates go through dart-throwing instead, rejecting any point that
 * falls within `minDist` of one already accepted. That produces BLUE NOISE:
 * still irregular, so it never looks like a dotted border, but with no two
 * points closer than the threshold. It is the same property antigravity gets
 * from its `poisson-disk-sampling` call, arrived at differently because we are
 * sampling a shape rather than filling a square.
 *
 * Coordinates come back NORMALISED to 0..1 so a cloud survives a window
 * resize: the hero rescales the same cloud instead of re-rasterising, which
 * matters because re-rasterising mid-morph would reshuffle every assignment
 * and visibly scramble the shape.
 */

/**
 * A cloud is a flat `[x0, y0, x1, y1, ...]` buffer, not an array of `{x, y}`.
 *
 * Two reasons, and the second is the real one. It avoids allocating several
 * thousand short-lived objects per shape, and — because TypeScript's
 * `noUncheckedIndexedAccess` does not apply to typed arrays — reading a
 * coordinate in the animation loop yields a `number` rather than a
 * `number | undefined` that has to be narrowed 60 times a second.
 */
export type Cloud = Float32Array;

/** A shape is just a draw call into a `size` x `size` square. */
export type DrawShape = (ctx: CanvasRenderingContext2D, size: number) => void;

/**
 * Raster resolution used for sampling.
 *
 * 300 rather than the 240 we started with: dart-throwing needs a denser
 * candidate pool than random picking, because it discards most of what it is
 * offered. Cost is O(RASTER^2) for the scan, which at this size is a fraction
 * of a millisecond and happens once per shape per breakpoint.
 */
const RASTER = 300;

/** Alpha above which a rasterised pixel counts as "painted". */
const ALPHA_FLOOR = 90;

/** How far `minDist` relaxes each round when a pass cannot place enough points. */
const RELAX = 0.82;

/**
 * Deterministic PRNG (mulberry32).
 *
 * Seeded on purpose: the shuffle decides which particle lands where, so an
 * unseeded shuffle would give a different morph on every page load and make a
 * bad-looking frame impossible to reproduce.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** In-place Fisher-Yates over a flat xy buffer, swapping whole pairs. */
function shufflePairs(buf: Float32Array, length: number, rand: () => number) {
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tx = buf[i * 2] as number;
    const ty = buf[i * 2 + 1] as number;
    buf[i * 2] = buf[j * 2] as number;
    buf[i * 2 + 1] = buf[j * 2 + 1] as number;
    buf[j * 2] = tx;
    buf[j * 2 + 1] = ty;
  }
}

/**
 * Dart-throwing with a uniform acceleration grid.
 *
 * The grid is what makes this linear rather than quadratic. Cells are sized
 * `minDist / sqrt(2)` so a cell can hold at most one accepted point, which
 * means a candidate only has to check the 5x5 block around it — anything
 * further away cannot possibly be within `minDist`.
 */
function dartThrow(
  candidates: Float32Array,
  candidateCount: number,
  wanted: number,
  minDist: number,
  out: Float32Array,
  accepted: number,
): number {
  const cell = minDist / Math.SQRT2;
  const cols = Math.ceil(1 / cell) + 1;
  const grid = new Int32Array(cols * cols).fill(-1);

  // Points accepted in an earlier (larger minDist) round still occupy space,
  // so they have to go into the grid before this round starts throwing.
  for (let i = 0; i < accepted; i++) {
    const gx = Math.min(cols - 1, Math.floor((out[i * 2] as number) / cell));
    const gy = Math.min(cols - 1, Math.floor((out[i * 2 + 1] as number) / cell));
    grid[gy * cols + gx] = i;
  }

  const minDist2 = minDist * minDist;

  for (let c = 0; c < candidateCount && accepted < wanted; c++) {
    const x = candidates[c * 2] as number;
    const y = candidates[c * 2 + 1] as number;
    const gx = Math.min(cols - 1, Math.floor(x / cell));
    const gy = Math.min(cols - 1, Math.floor(y / cell));

    let ok = true;
    for (let dy = -2; dy <= 2 && ok; dy++) {
      const ny = gy + dy;
      if (ny < 0 || ny >= cols) continue;
      for (let dx = -2; dx <= 2; dx++) {
        const nx = gx + dx;
        if (nx < 0 || nx >= cols) continue;
        const other = grid[ny * cols + nx] as number;
        if (other < 0) continue;
        const ox = (out[other * 2] as number) - x;
        const oy = (out[other * 2 + 1] as number) - y;
        if (ox * ox + oy * oy < minDist2) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) continue;

    out[accepted * 2] = x;
    out[accepted * 2 + 1] = y;
    grid[gy * cols + gx] = accepted;
    accepted++;
  }

  return accepted;
}

/** Runs dart-throwing repeatedly, relaxing `minDist` until `wanted` is met. */
function blueNoise(
  candidates: Float32Array,
  candidateCount: number,
  wanted: number,
  rand: () => number,
): Float32Array {
  const out = new Float32Array(wanted * 2);

  // Start from the spacing a perfectly even packing would give, then relax.
  // Starting too generous wastes a pass; starting too tight defeats the point.
  let minDist = Math.sqrt(1 / wanted) * 0.85;
  let accepted = 0;

  // Eight rounds is far more headroom than any of our shapes needs — the guard
  // exists so a pathological shape (a single painted pixel, say) terminates
  // rather than relaxing toward zero forever.
  for (let round = 0; round < 8 && accepted < wanted; round++) {
    accepted = dartThrow(candidates, candidateCount, wanted, minDist, out, accepted);
    minDist *= RELAX;
    // Re-shuffle between rounds so the next pass offers candidates in a new
    // order; re-walking the same order would keep hitting the same rejections.
    shufflePairs(candidates, candidateCount, rand);
  }

  // If even the last round fell short the shape is genuinely too small for the
  // budget. Fill the tail by jittering accepted points rather than leaving
  // zeros, which would park the remaining particles in the top-left corner.
  for (let i = accepted; i < wanted; i++) {
    const src = accepted > 0 ? Math.floor(rand() * accepted) : 0;
    out[i * 2] = (out[src * 2] as number) + (rand() - 0.5) * 0.01;
    out[i * 2 + 1] = (out[src * 2 + 1] as number) + (rand() - 0.5) * 0.01;
  }

  // Final shuffle. Blue noise is spatially ordered by acceptance, so without
  // this the index-to-index morph mapping would send neighbouring particles to
  // neighbouring destinations and the morph would resolve as a wipe rather
  // than a dissolve.
  shufflePairs(out, wanted, rand);
  return out;
}

/** Samples `count` evenly-spaced normalised points from a drawing. */
export function sampleShape(draw: DrawShape, count: number, seed: number): Cloud {
  const canvas = document.createElement("canvas");
  canvas.width = RASTER;
  canvas.height = RASTER;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  // A null 2d context means canvas is unavailable entirely (very old browser,
  // or a hardened environment). The hero already has a no-canvas path, so an
  // all-zero cloud is the honest answer rather than a thrown error.
  if (!ctx) return new Float32Array(count * 2);

  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw(ctx, RASTER);

  const { data } = ctx.getImageData(0, 0, RASTER, RASTER);

  const candidates = new Float32Array(RASTER * RASTER * 2);
  let painted = 0;
  for (let y = 0; y < RASTER; y++) {
    for (let x = 0; x < RASTER; x++) {
      if ((data[(y * RASTER + x) * 4 + 3] as number) > ALPHA_FLOOR) {
        candidates[painted * 2] = x / RASTER;
        candidates[painted * 2 + 1] = y / RASTER;
        painted++;
      }
    }
  }
  if (painted === 0) return new Float32Array(count * 2);

  const rand = mulberry32(seed);
  shufflePairs(candidates, painted, rand);
  return blueNoise(candidates, painted, count, rand);
}

/**
 * An evenly-spaced field of points across the whole unit square.
 *
 * This is the ambient layer — the drift of fine dots that sits behind
 * everything on the reference site and is most of why its pages feel like a
 * living surface rather than a static one. It is generated the same way as a
 * shape so the two layers share a visual grammar; only the colour and the
 * density tell them apart.
 */
export function sampleField(count: number, seed: number): Cloud {
  const rand = mulberry32(seed);

  // A generous candidate pool: dart-throwing rejects most of what it sees, and
  // an undersized pool is what makes a field look sparse in one corner.
  const pool = count * 24;
  const candidates = new Float32Array(pool * 2);
  for (let i = 0; i < pool; i++) {
    candidates[i * 2] = rand();
    candidates[i * 2 + 1] = rand();
  }

  return blueNoise(candidates, pool, count, rand);
}
