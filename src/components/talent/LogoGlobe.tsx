"use client";

import { useEffect, useRef } from "react";
import { type AdvisorCompany, advisorCompanies } from "./talent-content";

const globeCompanies = advisorCompanies.filter(
  (company) => !company.hiddenOnGlobe,
);
import styles from "./TalentPage.module.css";

type Vec = [number, number, number];
type TrailPoint = { xy: readonly [number, number]; hidden: boolean };

const TILT = -0.32;
const SPIN_PER_SECOND = 0.12;
const GRID_STEP_DEG = 30;
const ARC_CYCLE_MS = 7000;
// Share of each visible arc, from the back, that breaks up into dots.
const TRAIL_DOTTED_SHARE = 0.28;
const INK = "20, 27, 38";

const toRad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t ** 3;

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

function slerp(a: Vec, b: Vec, t: number, lift: number): Vec {
  const omega = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
  const s = Math.sin(omega) || 1;
  const wa = Math.sin((1 - t) * omega) / s;
  const wb = Math.sin(t * omega) / s;
  const height = 1 + lift * Math.sin(Math.PI * t);
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

// How much of a card's face survives when it is seen edge-on, so cards at the
// globe's rim stay legible slivers instead of collapsing to a line.
const MIN_CARD_FACE = 0.22;
// Card thickness as a share of its width, and how many outline copies fill
// the edge so it reads as solid rather than stacked.
const CARD_THICKNESS = 0.1;
const CARD_EDGE_STEPS = 5;

// A 2D canvas transform that lays a card flat on the sphere at view-space
// point `n`: its right edge runs east along the surface, its top edge north,
// both projected onto the screen. Cards on the far side are flipped back so
// their logos never read mirrored.
function surfaceTransform([nx, ny, nz]: Vec) {
  const eastLength = Math.hypot(nz, nx);
  let east: Vec =
    eastLength > 1e-3 ? [nz / eastLength, 0, -nx / eastLength] : [1, 0, 0];
  const north: Vec = [
    ny * east[2] - nz * east[1],
    nz * east[0] - nx * east[2],
    nx * east[1] - ny * east[0],
  ];
  if (nz < 0) east = [-east[0], -east[1], -east[2]];

  // Screen y runs down, so "up the card" is minus north.
  const tilt = 1 - MIN_CARD_FACE;
  return [
    MIN_CARD_FACE + tilt * east[0],
    tilt * -east[1],
    tilt * -north[0],
    MIN_CARD_FACE + tilt * north[1],
  ] as const;
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
      .slice(0, 2);
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

function drawMark(
  ctx: CanvasRenderingContext2D,
  company: AdvisorCompany,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const radius = size * 0.24;
  const left = x - size / 2;
  const top = y - size / 2;

  ctx.beginPath();
  ctx.roundRect(left, top, size, size, radius);
  ctx.fillStyle = company.background ?? "#fff";
  ctx.fill();

  if (!image.complete || !image.naturalWidth) return;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, size, size, radius);
  ctx.clip();
  // Tiles cover the square (cropping the long side); glyphs sit contained
  // inside an inset box, matching the list's CSS.
  const cover = company.fit === "tile";
  const box = cover
    ? size
    : size * (Number.parseFloat(company.size ?? "58") / 100);
  const fit = cover ? Math.max : Math.min;
  const scale = fit(box / image.naturalWidth, box / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
  ctx.restore();

  ctx.beginPath();
  ctx.roundRect(left + 0.5, top + 0.5, size - 1, size - 1, radius);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Lit from above, like the home page's event covers: the top edge catches
  // the light and the underside falls away into shade.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, size, size, radius);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, top, 0, top + size);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  sheen.addColorStop(0.06, "rgba(255, 255, 255, 0)");
  sheen.addColorStop(0.9, "rgba(0, 0, 0, 0)");
  sheen.addColorStop(1, "rgba(0, 0, 0, 0.08)");
  ctx.fillStyle = sheen;
  ctx.fillRect(left, top, size, size);
  ctx.restore();
}

// The card's edge: copies of its outline stepped back toward the globe, so
// it reads as a tile with a little thickness. The deepest copy carries the
// drop shadow, which is what lifts the whole card off the surface.
function drawCardEdge(
  ctx: CanvasRenderingContext2D,
  tilt: readonly [number, number, number, number],
  x: number,
  y: number,
  size: number,
  offsetX: number,
  offsetY: number,
) {
  const radius = size * 0.24;
  for (let step = CARD_EDGE_STEPS; step >= 1; step--) {
    const share = step / CARD_EDGE_STEPS;
    ctx.save();
    ctx.transform(...tilt, x + offsetX * share, y + offsetY * share);
    if (step === CARD_EDGE_STEPS) {
      ctx.shadowColor = "rgba(15, 15, 15, 0.16)";
      ctx.shadowBlur = size * 0.35;
      ctx.shadowOffsetY = size * 0.06;
    }
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 2, size, size, radius);
    ctx.fillStyle = share > 0.5 ? "#d4d8de" : "#e3e6ea";
    ctx.fill();
    ctx.restore();
  }
}

export function LogoGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const grid = gridLines();
    const nodes = fibonacciSphere(globeCompanies.length);
    const arcs = sweepingArcs(nodes);
    const rings = orbits();
    const images = globeCompanies.map((company) => {
      const image = new Image();
      image.decoding = "async";
      image.src = company.src;
      return image;
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
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
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.36;
      const turn = yaw + tiltX;
      const pitch = TILT + tiltY;
      const view = (p: Vec) => rotate(p, turn, pitch);
      const project = (p: Vec) => [cx + p[0] * radius, cy - p[1] * radius] as const;
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
        let previous: { p: Vec; xy: readonly [number, number]; hidden: boolean } | null =
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
          previous = { p, xy, hidden };
        }
        ctx.lineWidth = lineWidth;
        if (backAlpha > 0) {
          ctx.strokeStyle = `rgba(${INK}, ${backAlpha})`;
          ctx.stroke(back);
        }
        ctx.strokeStyle = `rgba(${INK}, ${frontAlpha})`;
        ctx.stroke(front);
      };

      // Paints one arc like a brush stroke that runs dry: full-bodied at the
      // leading end, thinning toward the back, then breaking into dots that
      // shrink, fade and spread apart until the trail disappears.
      const drawTrail = (points: TrailPoint[]) => {
        const end = points.length - 1;
        const solidFrom = Math.floor(end * TRAIL_DOTTED_SHARE);

        for (let i = solidFrom; i < end; i++) {
          const along = (i - solidFrom) / Math.max(1, end - solidFrom);
          const a = points[i];
          const b = points[i + 1];
          const depth = a.hidden || b.hidden ? 0.2 : 1;
          ctx.beginPath();
          ctx.moveTo(a.xy[0], a.xy[1]);
          ctx.lineTo(b.xy[0], b.xy[1]);
          ctx.strokeStyle = `rgba(${INK}, ${((0.1 + 0.32 * along) * depth).toFixed(3)})`;
          ctx.lineWidth = 0.5 + 1.1 * along;
          ctx.stroke();
        }

        let step = 2.2;
        for (let i = solidFrom; i >= 0; i -= step, step += 0.9) {
          const point = points[Math.round(i)];
          const along = i / Math.max(1, solidFrom);
          const depth = point.hidden ? 0.2 : 1;
          ctx.beginPath();
          ctx.arc(point.xy[0], point.xy[1], 0.45 + 0.9 * along, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${INK}, ${((0.04 + 0.3 * along) * depth).toFixed(3)})`;
          ctx.fill();
        }
      };

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";

      for (const line of grid) strokeLine(line, 0.1, 0, 1);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
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
        );
      });

      const tile = radius * 0.2;
      nodes
        .map((node, index) => ({ point: view(node), index }))
        .sort((a, b) => a.point[2] - b.point[2])
        .forEach(({ point, index }) => {
          const [x, y] = project(point);
          const front = clamp01((point[2] + 0.35) / 0.7);
          const tilt = surfaceTransform(point);
          const size = tile * (0.7 + 0.3 * front);
          // The card's back sits deeper along the surface normal, which on
          // screen points toward the globe's centre; a touch of drop keeps
          // the underside showing even on cards that face us head-on.
          const depth = size * CARD_THICKNESS;
          const edgeX = -point[0] * depth;
          const edgeY = point[1] * depth + size * 0.035;
          ctx.globalAlpha = 0.15 + 0.85 * front;
          drawCardEdge(ctx, tilt, x, y, size, edgeX, edgeY);
          ctx.save();
          ctx.transform(...tilt, x, y);
          drawMark(ctx, globeCompanies[index], images[index], 0, 0, size);
          ctx.restore();
        });
      ctx.globalAlpha = 1;
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
    // Redraw once marks arrive so a still (reduced-motion) globe isn't blank.
    images.forEach((image) => {
      image.onload = () => {
        if (!running) draw(performance.now());
      };
    });

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
      images.forEach((image) => {
        image.onload = null;
      });
    };
  }, []);

  return (
    <div className={styles.globe}>
      <canvas ref={canvasRef} className={styles.globeCanvas} aria-hidden="true" />
    </div>
  );
}
