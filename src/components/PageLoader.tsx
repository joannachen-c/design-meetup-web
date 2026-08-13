"use client";

import { useEffect, useState } from "react";
import { whenImagesReady, type SizedImage } from "@/lib/image";

const MIN_VISIBLE_MS = 520;
const MAX_VISIBLE_MS = 1200;
const MAX_VISIBLE_WITH_IMAGES_MS = 1800;
const FADE_MS = 300;

// onDone is optional: the home page uses it to start the gallery deal once the
// curtain is gone, but a page with nothing waiting on the reveal just fades in.
// waitForImages holds the curtain until first-paint covers have pixels, so the
// shelf does not deal in as empty white cards.
export function PageLoader({
  onDone,
  waitForImages,
}: {
  onDone?: () => void;
  waitForImages?: Array<SizedImage | string | null | undefined>;
} = {}) {
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

    const fontsReady = document.fonts
      ? document.fonts.ready.then(() => {}, () => {})
      : Promise.resolve();
    const imagesReady = waitForImages?.length
      ? whenImagesReady(waitForImages)
      : Promise.resolve();

    // Fonts settling is the last thing that shifts the page; covers have to be
    // decoded too or the shelf deals in empty. Never let either hold the
    // curtain past the hard cap.
    Promise.all([fontsReady, imagesReady]).then(release, release);
    timers.push(
      window.setTimeout(
        release,
        waitForImages?.length ? MAX_VISIBLE_WITH_IMAGES_MS : MAX_VISIBLE_MS,
      ),
    );

    return () => {
      root.classList.remove("is-loading");
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDone, waitForImages]);

  if (isDone) return null;

  return (
    <div
      className="page-loader fixed inset-0 z-[60] grid place-items-center bg-surface"
      data-leaving={isLeaving ? "" : undefined}
      role="status"
      aria-label="Loading Design Meetup"
    >
      <span className="relative block aspect-square w-[clamp(96px,28vw,128px)] md:w-[clamp(56px,6vw,76px)]">
        <img
          className="block size-full border-0 object-contain outline-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          src="/design-meetup-logo.svg"
          alt=""
          width={128}
          height={128}
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
