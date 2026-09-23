/**
 * The particle field.
 *
 * Two layers in one canvas:
 *
 *   AMBIENT — an evenly-spaced field of fine neutral dots drifting across the
 *   whole surface. It never morphs. On its own it is what the home page hero
 *   uses, and it is most of why the reference site feels like a living surface
 *   instead of a static one.
 *
 *   SHAPE — a denser, coloured cloud that springs toward a target and, when the
 *   target changes, dissolves into the next one. Optional: pass no shapes and
 *   only the ambient layer runs.
 *
 * Both react to the pointer and to click ripples, so they read as one material
 * rather than as a graphic sitting on a background.
 *
 * WHY CANVAS 2D AND NOT WEBGL
 * ---------------------------
 * The reference (antigravity.google) runs a GPGPU simulation: positions live in
 * a float texture, a fragment shader integrates them, two render targets
 * ping-pong each frame. That is the right call at a hundred thousand particles.
 * We draw around 4,000, which is squarely inside what one 2D context does at
 * 60fps, and it costs us no three.js in the bundle, no shader compile on first
 * paint, and no WebGL context to lose and restore.
 *
 * HOW IT DRAWS — THE PART THAT MAKES IT LOOK RIGHT
 * ------------------------------------------------
 * Every particle is the same width, drawn as a round-capped segment running
 * back along its own velocity. At rest that degenerates to a clean circle; in
 * motion it stretches into a capsule. Uniform size plus blue-noise spacing
 * (see pointCloud.ts) is the difference between "a designed field of points"
 * and "ink spatter" — our first version varied both and looked scratchy.
 *
 * Each layer batches every one of its particles into ONE path and strokes it
 * once. Stroking four thousand separate paths is the slow way to do this.
 */

import { useEffect, useRef } from "react";

import { sampleField, sampleShape, type Cloud, type DrawShape } from "./pointCloud";

/** How long a full morph takes, before the per-particle stagger is added. */
const MORPH_MS = 950;
/** Largest share of the morph a single particle can wait before setting off. */
const STAGGER = 0.55;

/** Spring constant pulling a shape particle toward its target. */
const SPRING = 0.055;
/** Velocity retained per frame. Below ~0.8 the cloud snaps and looks rigid. */
const DAMPING = 0.87;

/** The ambient layer is looser and slower — it should never look propelled. */
const FIELD_SPRING = 0.022;
const FIELD_DAMPING = 0.93;

/** Radius in CSS px within which the pointer pushes particles away. */
const CURSOR_RADIUS = 135;
const CURSOR_FORCE = 3.1;

/** Speed of a click ripple, CSS px per second. */
const WAVE_SPEED = 900;
/** Half-thickness of the ripple's push band, in CSS px. */
const WAVE_BAND = 62;
const WAVE_FORCE = 4.2;

/** Fraction of the shorter canvas edge the shape is drawn into. */
const SHAPE_SCALE = 0.74;

/** Uniform particle widths, CSS px. */
const SHAPE_DOT = 1.9;
const FIELD_DOT = 1.5;

/** Frames of velocity a capsule reaches back over, and its cap in CSS px. */
const TRAIL = 2.1;
const TRAIL_MAX = 16;
/**
 * Shortest segment we will draw.
 *
 * A truly zero-length subpath is not reliably rendered as a dot by a round
 * line cap across browsers, so every particle gets at least this much length.
 * At 0.6px it is visually a circle.
 */
const TRAIL_MIN = 0.6;

/**
 * Hues the ambient field is speckled with, and the share of it they take.
 *
 * Ordered warm-to-cool like the spectrum itself. Kept to a quarter of the
 * field: the neutral majority is what holds the thing together — colour every
 * dot and it stops being a field and becomes confetti.
 */
const FIELD_HUES = ["--flare-rgb", "--amber-rgb", "--teal-rgb", "--indigo-rgb", "--violet-rgb"];
const FIELD_HUE_SHARE = 0.26;

/** Target spacing of the ambient field, CSS px. Drives its count from area. */
const FIELD_SPACING = 32;
const FIELD_MAX = 1400;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where in the stagger this particle starts moving, 0..STAGGER. */
  delay: number;
  /** Idle drift, so a settled cloud still breathes. */
  phase: number;
  driftX: number;
  driftY: number;
  amp: number;
};

type Wave = { x: number; y: number; start: number };

/** An `--x-rgb: 14 14 14` token, parsed to channels. */
function channels(name: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return fallback;
  return [parts[0] as number, parts[1] as number, parts[2] as number];
}

type Rgb = [number, number, number];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const [ar, ag, ab] = a;
  const [br, bg, bb] = b;
  return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
}

const rgba = ([r, g, b]: Rgb, alpha: number) =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;

/** Shape-particle budget for a canvas of this width. Phones get a third. */
function budgetFor(width: number): number {
  if (width < 640) return 1300;
  if (width < 1024) return 2400;
  return 3600;
}

export type FieldTone = "light" | "dark";

export function ParticleField({
  shapes,
  stage = 0,
  /**
   * Token names of the colour each stage is drawn in, e.g. `--accent-rgb`.
   * The cloud lerps between them as it morphs, so a stage change is a change
   * of colour as much as a change of shape.
   */
  hues,
  tone = "light",
  ambient = true,
  ambientSpectrum = false,
  paused = false,
  className = "",
}: {
  shapes?: DrawShape[];
  stage?: number;
  hues?: string[];
  /** `dark` inverts the ambient layer for use on the near-black panel. */
  tone?: FieldTone;
  ambient?: boolean;
  /** Speckles the ambient field with spectrum colour. Used on the home hero. */
  ambientSpectrum?: boolean;
  /** Skips the animation frame entirely — used while the section is off-screen. */
  paused?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The engine's mutable state. It lives in refs because every field of it
  // changes 60 times a second and none of it belongs in React's render path.
  const shapeParticles = useRef<Particle[]>([]);
  const fieldParticles = useRef<Particle[]>([]);
  const clouds = useRef<Cloud[]>([]);
  const fieldCloud = useRef<Cloud | null>(null);
  const fromStage = useRef(stage);
  const toStage = useRef(stage);
  const morphStart = useRef(0);
  const pointer = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const waves = useRef<Wave[]>([]);
  const pausedRef = useRef(paused);
  /** Set by the main effect; lets the `paused` effect restart a stopped loop. */
  const kickRef = useRef<(() => void) | null>(null);

  pausedRef.current = paused;

  // The loop stops itself when it should not be running, so a change to
  // `paused` has to be able to wake it again.
  useEffect(() => {
    if (!paused) kickRef.current?.();
  }, [paused]);

  // Start a morph when the page moves to a new stage. Kept out of the main
  // effect so a stage change never tears down and rebuilds the point clouds —
  // rebuilding would reshuffle every assignment mid-flight and scramble the
  // shape on screen.
  useEffect(() => {
    if (toStage.current === stage) return;
    fromStage.current = toStage.current;
    toStage.current = stage;
    morphStart.current = performance.now();
  }, [stage]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const shapeList = shapes ?? [];
    const hueList = hues ?? [];

    let width = 0;
    let height = 0;
    let count = 0;
    let fieldCount = 0;
    let frame = 0;
    let last = performance.now();

    let inkRgb: Rgb = [14, 14, 14];
    let paperRgb: Rgb = [245, 242, 236];
    let stageRgb: Rgb[] = [];
    let fieldRgb: Rgb[] = [];

    const readTokens = () => {
      inkRgb = channels("--ink-rgb", [14, 14, 14]);
      paperRgb = channels("--paper-rgb", [245, 242, 236]);
      stageRgb = hueList.map((name) => channels(name, [193, 123, 63]));
      fieldRgb = FIELD_HUES.map((name) => channels(name, [193, 123, 63]));
    };
    readTokens();

    // The shape is drawn into a centred square, so the projection is the same
    // scalar and the same two offsets for every particle in a frame. Computed
    // once per resize rather than per particle.
    let shapeSize = 0;
    let shapeX = 0;
    let shapeY = 0;
    const measureShape = () => {
      shapeSize = Math.min(width, height) * SHAPE_SCALE;
      shapeX = (width - shapeSize) / 2;
      shapeY = (height - shapeSize) / 2;
    };

    const makeParticle = (x: number, y: number): Particle => ({
      x,
      y,
      vx: 0,
      vy: 0,
      delay: Math.random() * STAGGER,
      phase: Math.random() * Math.PI * 2,
      driftX: 0.35 + Math.random() * 0.6,
      driftY: 0.35 + Math.random() * 0.6,
      amp: 0.3 + Math.random() * 0.75,
    });

    const buildShape = () => {
      measureShape();
      const cloud = clouds.current[toStage.current];
      const next: Particle[] = new Array(count);
      for (let i = 0; i < count; i++) {
        // Particles are born ON their target rather than scattered, so the
        // first paint is the finished shape. Flying in from random points
        // looks impressive exactly once and delays the moment the visitor can
        // read what the shape is.
        next[i] = cloud
          ? makeParticle(
              shapeX + (cloud[i * 2] as number) * shapeSize,
              shapeY + (cloud[i * 2 + 1] as number) * shapeSize,
            )
          : makeParticle(width / 2, height / 2);
      }
      shapeParticles.current = next;
    };

    const buildField = () => {
      const cloud = fieldCloud.current;
      const next: Particle[] = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        const p = cloud
          ? makeParticle((cloud[i * 2] as number) * width, (cloud[i * 2 + 1] as number) * height)
          : makeParticle(Math.random() * width, Math.random() * height);
        // The ambient layer drifts further and slower than the shape. Sharing
        // the shape's amplitude made it look like it was being blown around.
        p.amp = 1.4 + Math.random() * 2.6;
        p.driftX *= 0.45;
        p.driftY *= 0.45;
        next[i] = p;
      }
      fieldParticles.current = next;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Capping DPR at 2 is a real decision: a 3x phone would otherwise ask the
      // compositor for nine times the pixels of a 1x screen to draw dots barely
      // 2px across.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;

      // Only the BACKING STORE is set here. The element's box is sized by its
      // `h-full w-full` classes and left alone.
      //
      // It used to set `style.width`/`style.height` too, and an inline style
      // beats a class: if a measurement was ever taken while the layout was in
      // a transient state — and ResizeObserver does not deliver callbacks in a
      // tab that is not rendering, so a bad first measurement can be the only
      // one — the canvas stayed frozen at that wrong size. Letting CSS own the
      // box means a stale measurement costs a little sharpness for one frame
      // instead of collapsing the element.
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      measureShape();

      if (shapeList.length > 0) {
        const nextCount = budgetFor(width);
        if (nextCount !== count || shapeParticles.current.length === 0) {
          count = nextCount;
          clouds.current = shapeList.map((draw, i) => sampleShape(draw, count, 1337 + i * 97));
          buildShape();
        }
      }

      if (ambient) {
        // Density from area, so the field looks equally dense on a phone and on
        // a 27" display instead of thinning out as the canvas grows.
        const nextField = Math.min(
          FIELD_MAX,
          Math.round((width * height) / (FIELD_SPACING * FIELD_SPACING)),
        );
        if (nextField !== fieldCount || fieldParticles.current.length === 0) {
          fieldCount = nextField;
          fieldCloud.current = sampleField(fieldCount, 4242);
          buildField();
        }
      }
    };

    /** Applies pointer repulsion and every live ripple to one particle. */
    const disturb = (p: Particle, now: number, acc: { x: number; y: number }) => {
      const ptr = pointer.current;
      if (ptr.active) {
        const dx = p.x - ptr.x;
        const dy = p.y - ptr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CURSOR_RADIUS && dist > 0.001) {
          // Squared falloff: a linear one produces a visible hard-edged disc of
          // displacement following the cursor.
          const falloff = 1 - dist / CURSOR_RADIUS;
          const push = (falloff * falloff * CURSOR_FORCE) / dist;
          acc.x += dx * push;
          acc.y += dy * push;
        }
      }

      const live = waves.current;
      for (let w = 0; w < live.length; w++) {
        const wave = live[w] as Wave;
        const radius = ((now - wave.start) / 1000) * WAVE_SPEED;
        const dx = p.x - wave.x;
        const dy = p.y - wave.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offset = Math.abs(dist - radius);
        if (offset < WAVE_BAND && dist > 0.001) {
          const band = 1 - offset / WAVE_BAND;
          // The ripple loses strength as it grows, so it dies out on its own
          // instead of ending abruptly at the edge of the canvas.
          const decay = 1 - Math.min(1, radius / (Math.max(width, height) * 1.1));
          const push = (band * band * decay * WAVE_FORCE) / dist;
          acc.x += dx * push;
          acc.y += dy * push;
        }
      }
    };

    /** Batches a whole layer into one path and strokes it once. */
    const paint = (list: Particle[], from: number, to: number, style: string, dot: number) => {
      if (to <= from) return;
      ctx.strokeStyle = style;
      ctx.lineWidth = dot;
      ctx.beginPath();
      for (let i = from; i < to; i++) {
        const p = list[i] as Particle;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        let len = Math.min(TRAIL_MAX, speed * TRAIL);
        let ux = 1;
        let uy = 0;
        if (speed > 0.0001) {
          ux = p.vx / speed;
          uy = p.vy / speed;
        }
        if (len < TRAIL_MIN) len = TRAIL_MIN;
        ctx.moveTo(p.x - ux * len, p.y - uy * len);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };

    const acc = { x: 0, y: 0 };

    /**
     * Whether the loop has any reason to run.
     *
     * Three conditions, and the first two used to be missing entirely: the
     * field kept animating while scrolled past, and the home page runs TWO of
     * these. That meant several thousand particles being integrated and redrawn
     * every frame, forever, on top of three video decodes and a momentum scroll
     * — most of it painting pixels nobody could see.
     */
    let onScreen = true;
    let tabVisible = !document.hidden;
    const shouldRun = () => onScreen && tabVisible && !pausedRef.current;

    const stopLoop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const startLoop = () => {
      if (frame || !shouldRun()) return;
      // Reset the clock: a loop that has been stopped for a minute would
      // otherwise integrate one enormous frame on the way back in.
      last = performance.now();
      frame = requestAnimationFrame(step);
    };
    kickRef.current = startLoop;

    const step = (now: number) => {
      if (!shouldRun()) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(step);

      // Frame delta, clamped. A backgrounded tab can hand us a delta of several
      // seconds on return; feeding that to the integrator throws every particle
      // off screen.
      const dt = Math.min(2.4, (now - last) / 16.667);
      last = now;

      const live = waves.current;
      for (let w = live.length - 1; w >= 0; w--) {
        if ((((now - (live[w] as Wave).start) / 1000) * WAVE_SPEED) > Math.max(width, height) * 1.2) {
          live.splice(w, 1);
        }
      }

      const time = now / 1000;

      // ── Ambient layer ────────────────────────────────────────────────────
      const field = fieldParticles.current;
      const fCloud = fieldCloud.current;
      if (fCloud) {
        for (let i = 0; i < field.length; i++) {
          const p = field[i] as Particle;
          const homeX = (fCloud[i * 2] as number) * width;
          const homeY = (fCloud[i * 2 + 1] as number) * height;
          acc.x = (homeX + Math.sin(time * p.driftX + p.phase) * p.amp - p.x) * FIELD_SPRING;
          acc.y = (homeY + Math.cos(time * p.driftY + p.phase) * p.amp - p.y) * FIELD_SPRING;
          disturb(p, now, acc);
          p.vx = (p.vx + acc.x * dt) * FIELD_DAMPING;
          p.vy = (p.vy + acc.y * dt) * FIELD_DAMPING;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
      }

      // ── Shape layer ──────────────────────────────────────────────────────
      const list = shapeParticles.current;
      const fromCloud = clouds.current[fromStage.current];
      const toCloud = clouds.current[toStage.current];
      const morph = (now - morphStart.current) / MORPH_MS;
      const morphing = morph < 1 + STAGGER;

      if (fromCloud && toCloud) {
        for (let i = 0; i < list.length; i++) {
          const p = list[i] as Particle;
          // Until a particle's stagger has elapsed it keeps aiming at the shape
          // it came from, which is what makes a morph ripple across the cloud
          // instead of every point leaving at once.
          const target = !morphing || morph > p.delay ? toCloud : fromCloud;
          const homeX = shapeX + (target[i * 2] as number) * shapeSize;
          const homeY = shapeY + (target[i * 2 + 1] as number) * shapeSize;
          acc.x = (homeX + Math.sin(time * p.driftX + p.phase) * p.amp - p.x) * SPRING;
          acc.y = (homeY + Math.cos(time * p.driftY + p.phase) * p.amp - p.y) * SPRING;
          disturb(p, now, acc);
          p.vx = (p.vx + acc.x * dt) * DAMPING;
          p.vy = (p.vy + acc.y * dt) * DAMPING;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
      }

      // ── Draw ─────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, width, height);

      if (field.length > 0) {
        const base = tone === "dark" ? paperRgb : inkRgb;
        const baseAlpha = tone === "dark" ? 0.34 : 0.26;

        if (ambientSpectrum && fieldRgb.length > 0) {
          // The field cloud was shuffled after sampling, so slicing it by index
          // scatters each hue evenly across the canvas — no sorting needed, and
          // a particle keeps its colour for the whole session.
          const plain = Math.floor(field.length * (1 - FIELD_HUE_SHARE));
          paint(field, 0, plain, rgba(base, baseAlpha), FIELD_DOT);

          const band = Math.ceil((field.length - plain) / fieldRgb.length);
          for (let h = 0; h < fieldRgb.length; h++) {
            const from = plain + h * band;
            const to = Math.min(field.length, from + band);
            // Colour reads far stronger than neutral at the same alpha, so the
            // speckle is drawn dimmer to stop it jumping out of the field.
            paint(field, from, to, rgba(fieldRgb[h] as Rgb, 0.5), FIELD_DOT);
          }
        } else {
          paint(field, 0, field.length, rgba(base, baseAlpha), FIELD_DOT);
        }
      }

      if (list.length > 0 && stageRgb.length > 0) {
        // The cloud's colour crosses over on the same curve as its shape, so a
        // stage change reads as one event rather than as a recolour that
        // happens to coincide with a morph.
        const t = Math.min(1, Math.max(0, morph));
        const a = stageRgb[fromStage.current % stageRgb.length] as Rgb;
        const b = stageRgb[toStage.current % stageRgb.length] as Rgb;
        const hue = mix(a, b, t);

        // A minority strand in near-ink keeps the cloud from flattening into a
        // single sheet of colour — it gives the shape depth at a glance.
        const split = Math.floor(list.length * 0.84);
        paint(list, 0, split, rgba(hue, 0.85), SHAPE_DOT);
        paint(list, split, list.length, rgba(inkRgb, 0.5), SHAPE_DOT);
      }
    };

    /**
     * Pointer tracking is on `window`, not on the canvas.
     *
     * The canvas is `pointer-events: none` so the headline and buttons layered
     * over it stay clickable — which also means it never receives a pointer
     * event of its own. Listening globally and converting to canvas coordinates
     * is what lets the field react while you are hovering a button on top of it.
     */
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        // Touch drags would otherwise leave a permanent dent wherever the
        // finger last was.
        active: event.pointerType !== "touch",
      };
    };
    const onPointerLeave = () => {
      pointer.current.active = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      // Bounded so a rapid-fire clicker cannot queue up an unbounded number of
      // per-particle distance checks per frame.
      if (waves.current.length > 5) waves.current.shift();
      waves.current.push({ x, y, start: performance.now() });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    // `rootMargin` starts the field a little before it scrolls into view, so it
    // is already settled rather than visibly springing into place at the edge.
    const visibility = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen) startLoop();
        else stopLoop();
      },
      { rootMargin: "15% 0px" },
    );
    visibility.observe(host);

    const onTabVisibility = () => {
      tabVisible = !document.hidden;
      if (tabVisible) startLoop();
      else stopLoop();
    };
    document.addEventListener("visibilitychange", onTabVisibility);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    startLoop();

    return () => {
      stopLoop();
      kickRef.current = null;
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onTabVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
    // Every dependency here is a module-level constant in each caller. Listing
    // them would rebuild every point cloud on each render if a caller ever
    // inlined one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={hostRef} className={`pointer-events-none ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
