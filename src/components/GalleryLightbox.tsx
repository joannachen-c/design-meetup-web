"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./IconButton";
import { isImageWarm, recoverImage, warmImages } from "@/lib/image";

const OVERLAY_DURATION_S = 0.2;
const PHOTO_ENTRANCE_DURATION_S = 0.42;
const PHOTO_ENTRANCE_Y_PX = 20;
// Long enough that a photo the rail already decoded never shows a placeholder:
// a shimmer washing over a photo that is already on screen reads as a fault.
const PLACEHOLDER_DELAY_MS = 120;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export type GalleryLightboxProps = {
  photos: string[];
  /**
   * The rail's renders of the same photos, in the same order. The rail has
   * already decoded these, so they paint immediately and stand in for the
   * full-size version instead of leaving the overlay empty.
   */
  previews?: string[];
  /** Index of the open photo, or null while the overlay is closed. */
  index: number | null;
  label: string;
  /** Event name, shown as the caption under the photo. */
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function GalleryLightbox({
  photos,
  previews,
  index,
  label,
  title,
  onIndexChange,
  onClose,
}: GalleryLightboxProps) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, true>>({});
  const [isPlaceholderDue, setIsPlaceholderDue] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = index !== null && index >= 0 && index < photos.length;
  const hasPrevious = isOpen && index > 0;
  const hasNext = isOpen && index < photos.length - 1;
  const photo = isOpen ? photos[index] : null;
  // The layer that sizes the frame: the rail's render when we have one, so the
  // photo's own shape is known before the full-size version lands.
  const basePhoto = (isOpen ? previews?.[index] : null) ?? photo;
  const isBaseLoaded = Boolean(basePhoto && loadedPhotos[basePhoto]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || isBaseLoaded) {
      setIsPlaceholderDue(false);
      return;
    }

    const timer = window.setTimeout(
      () => setIsPlaceholderDue(true),
      PLACEHOLDER_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [basePhoto, isBaseLoaded, isOpen]);

  // Keyed by URL so stepping back to a photo doesn't shimmer it again.
  const markLoaded = useCallback((url: string) => {
    setLoadedPhotos((previous) =>
      previous[url] ? previous : { ...previous, [url]: true },
    );
  }, []);

  // A cached photo can finish before hydration attaches onLoad, which would
  // leave the shimmer up for good.
  const markLoadedIfComplete = useCallback(
    (node: HTMLImageElement | null, url: string) => {
      if (node?.complete && node.naturalWidth > 0) markLoaded(url);
    },
    [markLoaded],
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      if (index === null) return;
      const next = index + direction;
      if (next < 0 || next > photos.length - 1) return;
      onIndexChange(next);
    },
    [index, onIndexChange, photos.length],
  );

  // Stepping should feel instant, so the neighbours are already decoded by the
  // time the arrow is pressed. Warming reaches two deep because a held-down
  // arrow outruns a single neighbour.
  useEffect(() => {
    if (index === null) return;
    warmImages([
      photos[index],
      photos[index + 1],
      photos[index - 1],
      photos[index + 2],
      photos[index - 2],
    ]);
  }, [index, photos]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
        return;
      }
      if (event.key !== "Tab") return;

      // The overlay is portaled past the page, so without this Tab would walk
      // out of it and into content the reader can no longer see.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled)",
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, step]);

  useEffect(() => {
    if (!isOpen) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      returnFocusRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!mounted) return null;

  const isPhotoWarm = isImageWarm(photo);

  return createPortal(
    <AnimatePresence>
      {isOpen && photo ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-white/88 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${label}, photo ${index + 1} of ${photos.length}`}
          ref={dialogRef}
          tabIndex={-1}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : OVERLAY_DURATION_S,
            ease: "easeOut",
          }}
          onClick={(event) => {
            // The figure spans the frame, so the wash beside the photo is still
            // inside it. Everything but the photo, caption and controls counts
            // as clicking off the image.
            const target = event.target as HTMLElement;
            if (target.closest("img, figcaption, button")) return;
            onClose();
          }}
        >
          {/* This wrapper mounts only when the overlay opens, so stepping keeps
              the site's entrance motion from replaying on every photo. */}
          <motion.figure
            className="m-0 grid h-[calc(78vh+44px)] w-[88vw] grid-rows-[78vh_20px] gap-6"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: PHOTO_ENTRANCE_Y_PX }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion
                ? undefined
                : {
                    opacity: 0,
                    transition: {
                      duration: OVERLAY_DURATION_S,
                      ease: "easeOut",
                    },
                  }
            }
            transition={{
              duration: reduceMotion ? 0 : PHOTO_ENTRANCE_DURATION_S,
              ease: "easeOut",
            }}
          >
            <div className="grid min-h-0 place-items-center">
              <div
                className="lightbox-frame relative inline-flex max-h-[78vh] max-w-[88vw] overflow-hidden rounded-md shadow-[0_24px_64px_rgba(0,0,0,0.22)]"
                data-base-loaded={isBaseLoaded ? "true" : "false"}
                data-loaded={loadedPhotos[photo] ? "true" : "false"}
                data-placeholder={
                  isPlaceholderDue && !isBaseLoaded ? "true" : "false"
                }
              >
                <img
                  className="lightbox-photo max-h-[78vh] max-w-[88vw] border-0 object-contain"
                  key={basePhoto}
                  src={basePhoto ?? undefined}
                  alt={`${label}, photo ${index + 1} of ${photos.length}`}
                  draggable="false"
                  decoding="sync"
                  ref={(node) =>
                    basePhoto ? markLoadedIfComplete(node, basePhoto) : undefined
                  }
                  onLoad={() => basePhoto && markLoaded(basePhoto)}
                  onError={() => basePhoto && markLoaded(basePhoto)}
                />
                {/* Fades in over the stand-in once the sharper render arrives. */}
                {basePhoto === photo ? null : (
                  <img
                    className="lightbox-photo-full absolute inset-0 size-full border-0 object-contain"
                    key={photo}
                    src={photo}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                    decoding={isPhotoWarm ? "sync" : "async"}
                    ref={(node) => markLoadedIfComplete(node, photo)}
                    onLoad={() => markLoaded(photo)}
                    onError={(event) => {
                      if (!recoverImage(event.currentTarget)) markLoaded(photo);
                    }}
                  />
                )}
                <span
                  className="detail-photo-shimmer bg-skeleton"
                  aria-hidden="true"
                />
              </div>
            </div>
            <figcaption className="m-0 self-start text-center text-sm leading-5 text-muted">
              {title}
            </figcaption>
          </motion.figure>

          <IconButton
            className="absolute top-[clamp(16px,3vw,32px)] right-[clamp(16px,3vw,32px)]"
            aria-label="Close gallery"
            variant="ghost"
            tone="muted"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>

          {photos.length > 1 ? (
            <>
              <IconButton
                className="absolute top-1/2 left-[clamp(12px,3vw,32px)] -translate-y-1/2"
                aria-label="Previous photo"
                variant="ghost"
                tone="muted"
                disabled={!hasPrevious}
                onClick={() => step(-1)}
              >
                <ChevronIcon direction="left" />
              </IconButton>
              <IconButton
                className="absolute top-1/2 right-[clamp(12px,3vw,32px)] -translate-y-1/2"
                aria-label="Next photo"
                variant="ghost"
                tone="muted"
                disabled={!hasNext}
                onClick={() => step(1)}
              >
                <ChevronIcon direction="right" />
              </IconButton>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
