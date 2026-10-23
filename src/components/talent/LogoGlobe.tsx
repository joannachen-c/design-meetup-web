"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { advisorCompanies } from "./talent-content";
import styles from "./TalentPage.module.css";

// Each logo appears twice, spread around the sphere, so the visible face
// always carries a full field of cards rather than a sparse handful.
const globeCompanies = advisorCompanies
  .filter((company) => !company.hiddenOnGlobe)
  .flatMap((company, index, list) => [company, list[(index + 7) % list.length]]);

type Vec = [number, number, number];
type TrailPoint = { xy: readonly [number, number]; hidden: boolean };

const TILT = -0.32;
const SPIN_PER_SECOND = 0.12;
const GRID_STEP_DEG = 30;
const ARC_CYCLE_MS = 7000;
// Camera distance in globe radii. The canvas and the CSS 3D cards share it,
// so the cards stay pinned to the ends of the arcs.
const FOCAL_RADII = 4.5;
// Card width as a share of the globe's radius, and the layers that build its
// edge: enough that the side reads as solid at a glancing angle.
const CARD_SIZE_RADII = 0.27;
const CARD_EDGE_LAYERS = 4;
// Cards are laid out this many times larger than they appear and scaled down
// in their 3D matrix, so the browser rasterises their logos sharply instead
// of stretching a small bitmap as the perspective brings a card forward.
const CARD_RASTER = 3;
// The highest a card floats off the surface, as a share of the radius.
const CARD_FLOAT_MAX = 0.12;
// Light from above, left and in front; cards facing it are brightest.
const LIGHT: Vec = normalize([-0.35, 0.6, 0.72]);
const INK = "20, 27, 38";

const toRad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t ** 3;

function normalize([x, y, z]: Vec): Vec {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

// Each arc draws out from its first logo to the second, holds, then retracts
// into the second, so the network reads as live connections being made.
function arcWindow(phase: number) {
  const head = easeOut(clamp01(phase / 0.4));
  const tail = easeIn(clamp01((phase - 0.65) / 0.35));
  return [tail, head] as const;
}

// Seeded so the arcs land in the same places on every load.
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function fibonacciSphere(count: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring];
  });
}

const fromLatLon = (lat: number, lon: number): Vec => [
  Math.cos(lat) * Math.sin(lon),
  Math.sin(lat),
  Math.cos(lat) * Math.cos(lon),
];

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Points along the great circle from `a` to `b` (unit vectors), rising from
// height `fromHeight` to `toHeight` and bowing `lift` higher in the middle.
function slerp(
  a: Vec,
  b: Vec,
  t: number,
  lift: number,
  fromHeight = 1,
  toHeight = 1,
): Vec {
  const omega = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
  const s = Math.sin(omega) || 1;
  const wa = Math.sin((1 - t) * omega) / s;
  const wb = Math.sin(t * omega) / s;
  const height =
    (fromHeight + (toHeight - fromHeight) * t) *
    (1 + lift * Math.sin(Math.PI * t));
  return [
    (a[0] * wa + b[0] * wb) * height,
    (a[1] * wa + b[1] * wb) * height,
    (a[2] * wa + b[2] * wb) * height,
  ];
}

function rotate([x, y, z]: Vec, yaw: number, pitch: number): Vec {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

// A CSS matrix3d that stands a card on the sphere at view-space point `n`
// (also its outward normal), with its right edge running east and its top
// edge north. View space has y up; CSS has y down, so y components flip.
function cardMatrix(n: Vec, x: number, y: number, z: number) {
  const eastLength = Math.hypot(n[2], n[0]);
  const east: Vec =
    eastLength > 1e-3
      ? [n[2] / eastLength, 0, -n[0] / eastLength]
      : [1, 0, 0];
  const north: Vec = [
    n[1] * east[2] - n[2] * east[1],
    n[2] * east[0] - n[0] * east[2],
    n[0] * east[1] - n[1] * east[0],
  ];
  const s = 1 / CARD_RASTER;
  return `matrix3d(${[
    east[0] * s, -east[1] * s, east[2] * s, 0,
    -north[0] * s, north[1] * s, -north[2] * s, 0,
    n[0] * s, -n[1] * s, n[2] * s, 0,
    x, y, z, 1,
  ]
    .map((value) => value.toFixed(4))
    .join(",")})`;
}

function gridLines(): Vec[][] {
  const lines: Vec[][] = [];
  for (let lat = -90 + GRID_STEP_DEG; lat < 90; lat += GRID_STEP_DEG) {
    lines.push(
      Array.from({ length: 97 }, (_, i) =>
        fromLatLon(toRad(lat), toRad((i / 96) * 360)),
      ),
    );
  }
  for (let lon = 0; lon < 180; lon += GRID_STEP_DEG) {
    lines.push(
      Array.from({ length: 97 }, (_, i) =>
        fromLatLon(toRad(-90 + (i / 96) * 360), toRad(lon)),
      ),
    );
  }
  return lines;
}

// Long, sweeping hops between logos: each one reaches across a good part of
// the globe and rises higher the farther it travels, like flight paths.
function sweepingArcs(nodes: Vec[]) {
  const random = seededRandom(7);
  const seen = new Set<string>();
  const arcs: { from: number; to: number; points: Vec[] }[] = [];
  nodes.forEach((node, i) => {
    const partners = nodes
      .map((other, j) => ({ j, angle: Math.acos(dot(node, other)) }))
      .filter(({ j, angle }) => j !== i && angle > toRad(55) && angle < toRad(150))
      .sort(() => random() - 0.5)
      .slice(0, 1);
    for (const { j, angle } of partners) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const lift = 0.04 + 0.2 * (angle / Math.PI);
      arcs.push({
        from: i,
        to: j,
        points: Array.from({ length: 65 }, (_, step) =>
          slerp(node, nodes[j], step / 64, lift),
        ),
      });
    }
  });
  return arcs;
}

// A few tilted rings just off the surface give the network its wrap-around
// sweep without tying every line to a logo.
function orbits(): Vec[][] {
  const random = seededRandom(23);
  return Array.from({ length: 5 }, () => {
    const radius = 1.05 + random() * 0.1;
    const tiltA = (random() - 0.5) * Math.PI;
    const tiltB = random() * Math.PI;
    return Array.from({ length: 145 }, (_, i) => {
      const angle = (i / 144) * Math.PI * 2;
      const flat: Vec = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
      return rotate(flat, tiltB, tiltA);
    });
  });
}

export function LogoGlobe() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!shell || !canvas || !ctx) return;

    const grid = gridLines();
    const nodes = fibonacciSphere(globeCompanies.length);
    // Each card floats at its own fixed height off the surface, seeded so it
    // is the same on every load, which keeps the field from reading flat.
    const floatRandom = seededRandom(41);
    const heights = nodes.map(() => 1 + CARD_FLOAT_MAX * floatRandom());
    const arcs = sweepingArcs(nodes);
    const rings = orbits();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let radius = 0;
    let focal = 0;
    let frame = 0;
    let running = false;
    let last = performance.now();
    let yaw = 0.6;
    let tiltX = 0;
    let tiltY = 0;
    let targetX = 0;
    let targetY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      radius = Math.min(width, height) * 0.36;
      focal = radius * FOCAL_RADII;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      shell.style.setProperty("--globe-focal", `${focal}px`);
      shell.style.setProperty(
        "--card-size",
        `${radius * CARD_SIZE_RADII * CARD_RASTER}px`,
      );
    };

    const draw = (time: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const turn = yaw + tiltX;
      const pitch = TILT + tiltY;
      const view = (p: Vec) => rotate(p, turn, pitch);
      // The same pinhole camera the CSS `perspective` uses for the cards.
      const project = (p: Vec) => {
        const scale = focal / (focal - p[2] * radius);
        return [
          cx + p[0] * radius * scale,
          cy - p[1] * radius * scale,
        ] as const;
      };
      // Behind the sphere and inside its outline: hidden by the globe.
      const occluded = (p: Vec) => p[2] < 0 && p[0] * p[0] + p[1] * p[1] < 1;

      // Strokes a 3D polyline in two passes so the parts the globe hides can
      // stay faint (or vanish) while the parts in front read clearly.
      const strokeLine = (
        points: Vec[],
        frontAlpha: number,
        backAlpha: number,
        lineWidth: number,
      ) => {
        const front = new Path2D();
        const back = new Path2D();
        let previous: { xy: readonly [number, number]; hidden: boolean } | null =
          null;
        for (const point of points) {
          const p = view(point);
          const xy = project(p);
          const hidden = occluded(p);
          if (previous) {
            const path = hidden || previous.hidden ? back : front;
            path.moveTo(previous.xy[0], previous.xy[1]);
            path.lineTo(xy[0], xy[1]);
          }
          previous = { xy, hidden };
        }
        ctx.lineWidth = lineWidth;
        if (backAlpha > 0) {
          ctx.strokeStyle = `rgba(${INK}, ${backAlpha})`;
          ctx.stroke(back);
        }
        ctx.strokeStyle = `rgba(${INK}, ${frontAlpha})`;
        ctx.stroke(front);
      };

      // Paints one arc like a brush stroke: full-bodied at the leading end,
      // thinning and fading toward the tail until it disappears. While the
      // line is still drawing out, a single comet dot rides its head.
      const drawTrail = (points: TrailPoint[], drawingOut: boolean) => {
        const end = points.length - 1;
        // Butt caps: round caps on short translucent segments overlap at
        // every joint and bead the line into dots.
        ctx.lineCap = "butt";
        for (let i = 0; i < end; i++) {
          const along = i / Math.max(1, end - 1);
          const a = points[i];
          const b = points[i + 1];
          const depth = a.hidden || b.hidden ? 0.2 : 1;
          ctx.beginPath();
          ctx.moveTo(a.xy[0], a.xy[1]);
          ctx.lineTo(b.xy[0], b.xy[1]);
          ctx.strokeStyle = `rgba(${INK}, ${(0.42 * along ** 1.4 * depth).toFixed(3)})`;
          ctx.lineWidth = 0.4 + 1.2 * along;
          ctx.stroke();
        }

        ctx.lineCap = "round";
        const head = points[end];
        if (!drawingOut || head.hidden) return;
        ctx.beginPath();
        ctx.arc(head.xy[0], head.xy[1], 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${INK}, 0.6)`;
        ctx.fill();
      };

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";

      for (const line of grid) strokeLine(line, 0.1, 0, 1);

      // Under perspective the visible rim is a little smaller than the
      // equator: it is where sight lines graze the sphere.
      const rim = radius * (focal / Math.sqrt(focal * focal - radius * radius));
      ctx.beginPath();
      ctx.arc(cx, cy, rim, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${INK}, 0.14)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (const ring of rings) strokeLine(ring, 0.12, 0.03, 1);

      arcs.forEach((arc, index) => {
        const [tail, head] = reduceMotion
          ? [0, 1]
          : arcWindow((time / ARC_CYCLE_MS + index * 0.29) % 1);
        const last = arc.points.length - 1;
        const from = Math.floor(tail * last);
        const to = Math.ceil(head * last);
        if (to - from < 2) return;
        drawTrail(
          arc.points.slice(from, to + 1).map((point) => {
            const p = view(point);
            return { xy: project(p), hidden: occluded(p) };
          }),
          head < 1,
        );
      });

      nodes.forEach((node, index) => {
        const card = cardRefs.current[index];
        if (!card) return;
        const p = view(node);
        const lifted = heights[index];
        // Cards fade out as they cross the rim and are gone on the far side:
        // their stacked edge layers multiply any partial opacity back toward
        // solid, so a "faint" far card would read as a grey slab.
        const front = clamp01((p[2] + 0.15) / 0.4);
        card.style.visibility = front > 0 ? "visible" : "hidden";
        card.style.transform = cardMatrix(
          p,
          cx + p[0] * radius * lifted,
          cy - p[1] * radius * lifted,
          p[2] * radius * lifted,
        );
        card.style.setProperty("--fade", (front ** 2).toFixed(3));
        card.style.setProperty(
          "--shade",
          ((1 - clamp01(dot(p, LIGHT))) * 0.07).toFixed(3),
        );
      });
    };

    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, 0.05);
      last = now;
      yaw += SPIN_PER_SECOND * elapsed;
      tiltX += (targetX - tiltX) * 0.06;
      tiltY += (targetY - tiltY) * 0.06;
      draw(now);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.5;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
    };

    resize();
    draw(0);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    visibility.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div ref={shellRef} className={styles.globe} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.globeCanvas} />
      <div className={styles.globeCards}>
        {globeCompanies.map((company, index) => (
          <div
            key={`${company.name}-${index}`}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className={styles.card3d}
          >
            {Array.from({ length: CARD_EDGE_LAYERS }, (_, layer) => (
              <span
                key={layer}
                className={styles.cardLayer}
                style={{ "--layer": layer + 1 } as CSSProperties}
              />
            ))}
            <span className={styles.cardBack} />
            <span
              className={styles.cardFace}
              data-fit={company.fit}
              style={
                {
                  background: company.background,
                  "--mark-size": company.size,
                } as CSSProperties
              }
            >
              <img src={company.src} alt="" width={96} height={96} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
