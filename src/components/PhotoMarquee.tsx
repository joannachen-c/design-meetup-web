"use client";

import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { recoverImage, sizedImage } from "@/lib/image";
import type { MeetupEvent } from "@/lib/supabase";

const MARQUEE_PHOTO_LIMIT = 8;
const MARQUEE_PHOTO_RENDER = { width: 283, quality: 90 } as const;
const MARQUEE_SECONDS_PER_PHOTO = 7;
const EXTRA_MARQUEE_PHOTOS = ["/marquee/IMG_9707.jpg"];

function isPlaceholderPhoto(url: string) {
  return url.includes("/placeholders/");
}

function isUsablePhoto(url: string, seen: Set<string>) {
  return Boolean(url) && !seen.has(url);
}

// Extra local stills first, then real recap photos (one per event, then fill,
// then covers) so the strip isn't a single night's recap. Shared seed
// placeholders are appended after, unique by URL — the per-event rail still
// hides that set.
function marqueePhotoUrls(events: MeetupEvent[], limit = MARQUEE_PHOTO_LIMIT) {
  const seen = new Set<string>();
  const urls: string[] = [];

  const take = (url: string) => {
    if (!isUsablePhoto(url, seen)) return;
    seen.add(url);
    urls.push(url);
  };

  for (const url of EXTRA_MARQUEE_PHOTOS) take(url);

  for (const event of events) {
    if (urls.length >= limit) break;
    const photo = (event.gallery_images ?? []).find(
      (image) =>
        isUsablePhoto(image.image_url, seen) &&
        !isPlaceholderPhoto(image.image_url),
    );
    if (photo) take(photo.image_url);
  }

  for (const event of events) {
    if (urls.length >= limit) break;
    for (const image of event.gallery_images ?? []) {
      if (isPlaceholderPhoto(image.image_url)) continue;
      take(image.image_url);
      if (urls.length >= limit) break;
    }
  }

  for (const event of events) {
    if (urls.length >= limit) break;
    take(event.image_url);
  }

  for (const event of events) {
    for (const image of event.gallery_images ?? []) {
      if (isPlaceholderPhoto(image.image_url)) take(image.image_url);
    }
  }

  return urls;
}

export function PhotoMarquee({ events }: { events: MeetupEvent[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  const photos = useMemo(
    () =>
      marqueePhotoUrls(events).map((url) => sizedImage(url, MARQUEE_PHOTO_RENDER)),
    [events],
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (photos.length === 0) return null;

  const paused = Boolean(reduceMotion) || !isVisible;
  const duration = `${Math.max(photos.length, 1) * MARQUEE_SECONDS_PER_PHOTO}s`;

  return (
    <div
      className="photo-marquee bg-surface pt-12 pb-[clamp(48px,6.5vw,96px)]"
      ref={rootRef}
      aria-hidden="true"
    >
      <div className="photo-marquee-viewport">
        <div
          className="photo-marquee-track pointer-events-none"
          data-paused={paused ? "" : undefined}
          style={{ "--marquee-duration": duration } as CSSProperties}
        >
          {Array.from({ length: 2 }, (_, copy) => (
            <ul className="photo-marquee-set m-0 flex gap-5 pr-5" key={copy}>
              {photos.map((photo, index) => (
                <li className="photo-marquee-item" key={`${copy}-${index}`}>
                  <img
                    className="photo-marquee-photo block size-full select-none rounded-md border-0 bg-surface-muted object-cover outline-none"
                    src={photo.src}
                    srcSet={photo.srcSet}
                    alt=""
                    draggable="false"
                    decoding="async"
                    loading="lazy"
                    onError={(event) => recoverImage(event.currentTarget)}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
