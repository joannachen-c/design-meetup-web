"use client";

import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 520;
const MAX_VISIBLE_MS = 1200;
const FADE_MS = 300;

// onDone is optional: the home page uses it to start the gallery deal once the
// curtain is gone, but a page with nothing waiting on the reveal just fades in.
export function PageLoader({ onDone }: { onDone?: () => void } = {}) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("is-loading");

    const mountedAt = performance.now();
    const timers: number[] = [];
    let released = false;

    const release = () => {
      if (released) return;
      released = true;

      const remaining = Math.max(
        0,
        MIN_VISIBLE_MS - (performance.now() - mountedAt),
      );

      timers.push(
        window.setTimeout(() => {
          root.classList.remove("is-loading");
          setIsLeaving(true);
          timers.push(
            window.setTimeout(() => {
              setIsDone(true);
              onDone?.();
            }, FADE_MS),
          );
        }, remaining),
      );
    };

    // Fonts settling is the last thing that shifts the page, but never let a
    // slow font request hold the curtain past the hard cap.
    if (document.fonts) {
      document.fonts.ready.then(release, release);
    } else {
      release();
    }
    timers.push(window.setTimeout(release, MAX_VISIBLE_MS));

    return () => {
      root.classList.remove("is-loading");
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDone]);

  if (isDone) return null;

  return (
    <div
      className="page-loader fixed inset-0 z-[60] grid place-items-center bg-white"
      data-leaving={isLeaving ? "" : undefined}
      role="status"
      aria-label="Loading Design Meetup"
    >
      <span className="relative block aspect-square w-[clamp(56px,6vw,76px)]">
        <img
          className="block size-full border-0 object-contain outline-none"
          src="/design-meetup-logo.png"
          alt=""
          width={76}
          height={76}
          fetchPriority="high"
          decoding="async"
        />
        <span
          className="page-loader-sheen absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <span className="page-loader-band" />
        </span>
      </span>
    </div>
  );
}
