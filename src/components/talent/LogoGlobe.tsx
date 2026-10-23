"use client";

import { useEffect, useRef } from "react";
import { type AdvisorCompany, advisorCompanies } from "./talent-content";
import styles from "./TalentPage.module.css";

type Vec = [number, number, number];

const DOT_COUNT = 560;
const TILT = -0.32;
const SPIN_PER_SECOND = 0.14;
const ARC_SAMPLES = 24;
const ARC_LIFT = 0.14;
const INK = "20, 27, 38";

function fibonacciSphere(count: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring];
  });
}

const distance = (a: Vec, b: Vec) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

// Each logo links to its two nearest neighbours, which spreads the arcs evenly
// over the sphere instead of bunching them at the poles.
function nearestLinks(points: Vec[], perNode: number) {
  const links = new Map<string, [number, number]>();
  points.forEach((point, i) => {
    points
      .map((other, j) => ({ j, d: distance(point, other) }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, perNode)
      .forEach(({ j }) => {
        links.set(i < j ? `${i}-${j}` : `${j}-${i}`, [
          Math.min(i, j),
          Math.max(i, j),
        ]);
      });
  });
  return [...links.values()];
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

function slerp(a: Vec, b: Vec, t: number): Vec {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const s = Math.sin(omega) || 1;
  const wa = Math.sin((1 - t) * omega) / s;
  const wb = Math.sin(t * omega) / s;
  const lift = 1 + ARC_LIFT * Math.sin(Math.PI * t);
  return [
    (a[0] * wa + b[0] * wb) * lift,
    (a[1] * wa + b[1] * wb) * lift,
    (a[2] * wa + b[2] * wb) * lift,
  ];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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

    const dots = fibonacciSphere(DOT_COUNT);
    const nodes = fibonacciSphere(advisorCompanies.length);
    const links = nearestLinks(nodes, 2);
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
      const pitch = TILT + tiltY;
      const turn = yaw + tiltX;
      const project = (p: Vec) => {
        const depth = 1 + p[2] * 0.12;
        return [cx + p[0] * radius * depth, cy - p[1] * radius * depth] as const;
      };

      ctx.clearRect(0, 0, width, height);

      // Body: a soft lit sphere so the dots read as a surface, not a cloud.
      const body = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.1,
        cx,
        cy,
        radius * 1.05,
      );
      body.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      body.addColorStop(0.7, "rgba(243, 244, 246, 0.7)");
      body.addColorStop(1, "rgba(229, 231, 235, 0.35)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      for (const dot of dots) {
        const p = rotate(dot, turn, pitch);
        const [x, y] = project(p);
        const alpha = p[2] > 0 ? 0.08 + 0.2 * p[2] : 0.05 * (1 + p[2]);
        ctx.fillStyle = `rgba(${INK}, ${alpha.toFixed(3)})`;
        ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      }

      const rotated = nodes.map((node) => rotate(node, turn, pitch));

      links.forEach(([a, b], index) => {
        const from = rotated[a];
        const to = rotated[b];
        const front = clamp01(((from[2] + to[2]) / 2 + 0.6) / 1.2);
        ctx.beginPath();
        for (let step = 0; step <= ARC_SAMPLES; step++) {
          const [x, y] = project(slerp(from, to, step / ARC_SAMPLES));
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${INK}, ${(0.06 + 0.34 * front).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        if (front > 0.45) {
          const t = (time / 2600 + index * 0.37) % 1;
          const [x, y] = project(slerp(from, to, t));
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${INK}, ${(0.75 * front).toFixed(3)})`;
          ctx.fill();
        }
      });

      const order = rotated
        .map((point, index) => ({ point, index }))
        .sort((a, b) => a.point[2] - b.point[2]);
      const tile = radius * 0.2;
      for (const { point, index } of order) {
        const [x, y] = project(point);
        const front = clamp01((point[2] + 0.35) / 0.7);
        ctx.globalAlpha = 0.18 + 0.82 * front;
        drawMark(
          ctx,
          advisorCompanies[index],
          images[index],
          x,
          y,
          tile * (0.7 + 0.3 * front),
        );
      }
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
