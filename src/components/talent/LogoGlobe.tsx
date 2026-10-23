"use client";

import { useEffect, useRef } from "react";
import { type AdvisorCompany, advisorCompanies } from "./talent-content";
import styles from "./TalentPage.module.css";

type Vec = [number, number, number];

const TILT = -0.32;
const SPIN_PER_SECOND = 0.12;
const GRID_STEP_DEG = 30;
const ARC_CYCLE_MS = 7000;
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

  ctx.save();
  ctx.shadowColor = "rgba(15, 15, 15, 0.14)";
  ctx.shadowBlur = size * 0.35;
  ctx.shadowOffsetY = size * 0.08;
  ctx.beginPath();
  ctx.roundRect(left, top, size, size, radius);
  ctx.fillStyle = company.background ?? "#fff";
  ctx.fill();
  ctx.restore();

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
}

export function LogoGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const grid = gridLines();
    const nodes = fibonacciSphere(advisorCompanies.length);
    const arcs = sweepingArcs(nodes);
    const rings = orbits();
    const images = advisorCompanies.map((company) => {
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
        if (to - from < 1) return;
        strokeLine(arc.points.slice(from, to + 1), 0.34, 0.06, 1.1);

        // A dot rides each moving end: the head as the line draws out, the
        // tail as it retracts. Ends parked on a logo sit under its tile.
        for (const end of [from, to]) {
          const p = view(arc.points[end]);
          if (occluded(p)) continue;
          const [x, y] = project(p);
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${INK}, 0.6)`;
          ctx.fill();
        }
      });

      const tile = radius * 0.2;
      nodes
        .map((node, index) => ({ point: view(node), index }))
        .sort((a, b) => a.point[2] - b.point[2])
        .forEach(({ point, index }) => {
          const [x, y] = project(point);
          const front = clamp01((point[2] + 0.35) / 0.7);
          ctx.globalAlpha = 0.15 + 0.85 * front;
          drawMark(
            ctx,
            advisorCompanies[index],
            images[index],
            x,
            y,
            tile * (0.7 + 0.3 * front),
          );
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
