"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./IconButton";
import {
  isImageWarm,
  recoverImage,
  warmImages,
  type SizedImage,
} from "@/lib/image";

type PhotoSize = { width: number; height: number };
type Preview = string | SizedImage;

function previewParts(entry: Preview | null | undefined): SizedImage | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry ? { src: entry } : null;
  return entry.src ? entry : null;
}

function sizeFromImage(image: HTMLImageElement): PhotoSize | null {
  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  const width = Number(image.getAttribute("width"));
  const height = Number(image.getAttribute("height"));
  if (width > 0 && height > 0) return { width, height };
  return null;
}

// The rail has usually already decoded this photo, so its natural size is
// sitting on an <img> in the document even before the overlay's own request
// finishes. Walking those nodes (then a cache probe) is how a landscape
// frame can be ready on the same step that changes the index.
function readPhotoSize(url: string | null | undefined): PhotoSize | null {
  if (!url || typeof document === "undefined") return null;

  for (const image of document.images) {
    if (image.src !== url && image.currentSrc !== url) continue;
    const size = sizeFromImage(image);
    if (size) return size;
  }

  const probe = new Image();
  probe.src = url;
  return sizeFromImage(probe);
}

const OVERLAY_DURATION_S = 0.2;
const PHOTO_ENTRANCE_DURATION_S = 0.42;
const PHOTO_ENTRANCE_Y_PX = 20;
// Long enough that a photo the rail already decoded never shows a placeholder:
// a shimmer washing over a photo that is already on screen reads as a fault.
const PLACEHOLDER_DELAY_MS = 120;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      className={
        direction === "left"
          ? "size-5 translate-x-[0.25px]"
          : "size-5 -translate-x-[0.25px]"
      }
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

type PaintedPhoto = {
  base: string;
  srcSet?: string;
  photo: string;
  size: PhotoSize | null;
};

export type GalleryLightboxProps = {
  photos: string[];
  /**
   * The rail's renders of the same photos, in the same order. Pass the same
   * `src`/`srcSet` the rail used: a retina visitor already decoded the 2x
   * candidate, and a 1x-only stand-in would miss that cache and shimmer.
   */
  previews?: Preview[];
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
  const [photoSizes, setPhotoSizes] = useState<Record<string, PhotoSize>>({});
  const [isPlaceholderDue, setIsPlaceholderDue] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = index !== null && index >= 0 && index < photos.length;
  const hasPrevious = isOpen && photos.length > 1;
  const hasNext = isOpen && photos.length > 1;
  const photo = isOpen ? photos[index] : null;
  const basePreview = isOpen ? previewParts(previews?.[index]) : null;
  // The layer that sizes the frame: the rail's render when we have one, so the
  // photo's own shape is known before the full-size version lands.
  const basePhoto = basePreview?.src ?? photo;
  const baseSrcSet = basePreview?.srcSet;
  const isBaseLoaded = Boolean(basePhoto && loadedPhotos[basePhoto]);
  const isFullLoaded = Boolean(
    photo && (loadedPhotos[photo] || isImageWarm(photo)),
  );
  const incomingSize =
    (basePhoto && photoSizes[basePhoto]) ||
    (photo && photoSizes[photo]) ||
    readPhotoSize(basePhoto) ||
    readPhotoSize(photo);

  // Stepping remounts the incoming img. Until it has pixels, keep the last
  // painted photo on screen so a gray wash never replaces it.
  const paintedRef = useRef<PaintedPhoto | null>(null);
  if (!isOpen) {
    paintedRef.current = null;
  } else if (isBaseLoaded && basePhoto && photo) {
    paintedRef.current = {
      base: basePhoto,
      srcSet: baseSrcSet,
      photo,
      size: incomingSize,
    };
  }
  const painted = paintedRef.current;
  const holding = Boolean(painted && !isBaseLoaded);
  const frameSize = holding ? painted?.size : incomingSize;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || isBaseLoaded || holding) {
      setIsPlaceholderDue(false);
      return;
    }

    const timer = window.setTimeout(
      () => setIsPlaceholderDue(true),
      PLACEHOLDER_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [basePhoto, holding, isBaseLoaded, isOpen]);

  // Keyed by URL so stepping back to a photo doesn't shimmer it again.
  const markLoaded = useCallback((url: string) => {
    setLoadedPhotos((previous) =>
      previous[url] ? previous : { ...previous, [url]: true },
    );
  }, []);

  // Preview and full-size are the same photograph, so a size learned from
  // either one is enough to keep the frame still while the other decodes.
  const rememberSize = useCallback(
    (url: string, size: PhotoSize | null) => {
      if (!size) return;
      const paired =
        url === photo ? basePhoto : url === basePhoto ? photo : null;
      setPhotoSizes((previous) => {
        const urls = [url, paired].filter((value): value is string =>
          Boolean(value),
        );
        let changed = false;
        const next = { ...previous };
        for (const key of urls) {
          if (
            next[key]?.width === size.width &&
            next[key]?.height === size.height
          ) {
            continue;
          }
          next[key] = size;
          changed = true;
        }
        return changed ? next : previous;
      });
    },
    [basePhoto, photo],
  );

  // A cached photo can finish before hydration attaches onLoad, which would
  // leave the shimmer up for good. Object refs + layout effects stay stable
  // across renders; inline callback refs re-fire every commit in React 19 and
  // loop setState into "Maximum update depth exceeded".
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const fullImgRef = useRef<HTMLImageElement | null>(null);

  const markLoadedIfComplete = useCallback(
    (node: HTMLImageElement | null, url: string | null) => {
      if (!url || !node?.complete || node.naturalWidth <= 0) return;
      markLoaded(url);
      rememberSize(url, sizeFromImage(node));
    },
    [markLoaded, rememberSize],
  );

  useLayoutEffect(() => {
    markLoadedIfComplete(baseImgRef.current, basePhoto);
  }, [basePhoto, markLoadedIfComplete]);

  useLayoutEffect(() => {
    if (!photo || photo === basePhoto) return;
    markLoadedIfComplete(fullImgRef.current, photo);
  }, [basePhoto, markLoadedIfComplete, photo]);

  const step = useCallback(
    (direction: -1 | 1) => {
      if (index === null || photos.length === 0) return;
      onIndexChange((index + direction + photos.length) % photos.length);
    },
    [index, onIndexChange, photos.length],
  );

  // Stepping should feel instant, so the neighbours are already decoded by the
  // time the arrow is pressed. Warming reaches two deep because a held-down
  // arrow outruns a single neighbour.
  useEffect(() => {
    if (index === null || photos.length === 0) return;
    const wrap = (offset: number) =>
      photos[(index + offset + photos.length) % photos.length];
    warmImages([
      photos[index],
      wrap(1),
      wrap(-1),
      wrap(2),
      wrap(-2),
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
          className="lightbox-shell fixed inset-0 z-50 grid place-items-center bg-white/88 font-['Alte_Haas_Grotesk',sans-serif] text-ink antialiased backdrop-blur-md [font-synthesis:none]"
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
            if (target.closest("img, figcaption, button, .lightbox-arrows")) return;
            onClose();
          }}
        >
          {/* This wrapper mounts only when the overlay opens, so stepping keeps
              the site's entrance motion from replaying on every photo. */}
          <motion.figure
            className="lightbox-figure max-[520px]:pb-[max(4px,env(safe-area-inset-bottom))]"
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
              {/* Shadow lives outside the clipped photo so radius clipping
                  cannot paint the same inset edge the event covers use. */}
              <div className="inline-flex rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.22)]">
                <div
                  className="lightbox-frame relative inline-flex max-h-[78vh] max-w-[88vw] rounded-xl"
                  data-base-loaded={isBaseLoaded || holding ? "true" : "false"}
                  data-has-aspect={frameSize ? "true" : "false"}
                  data-holding={holding ? "true" : "false"}
                  data-loaded={isFullLoaded ? "true" : "false"}
                  data-placeholder={
                    isPlaceholderDue && !isBaseLoaded && !holding
                      ? "true"
                      : "false"
                  }
                  style={
                    frameSize
                      ? ({
                          "--lightbox-aspect": `${frameSize.width} / ${frameSize.height}`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                <img
                  className="lightbox-photo max-h-[78vh] max-w-[88vw] border-0 object-contain"
                  key={basePhoto}
                  src={basePhoto ?? undefined}
                  srcSet={baseSrcSet}
                  alt={`${label}, photo ${index + 1} of ${photos.length}`}
                  draggable="false"
                  decoding="sync"
                  ref={baseImgRef}
                  onLoad={(event) => {
                    if (!basePhoto) return;
                    markLoaded(basePhoto);
                    rememberSize(basePhoto, sizeFromImage(event.currentTarget));
                  }}
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
                    ref={fullImgRef}
                    onLoad={(event) => {
                      markLoaded(photo);
                      rememberSize(photo, sizeFromImage(event.currentTarget));
                    }}
                    onError={(event) => {
                      if (!recoverImage(event.currentTarget)) markLoaded(photo);
                    }}
                  />
                )}
                {holding && painted ? (
                  <>
                    <img
                      className="lightbox-photo lightbox-photo-held max-h-[78vh] max-w-[88vw] border-0 object-contain"
                      src={painted.base}
                      srcSet={painted.srcSet}
                      alt=""
                      aria-hidden="true"
                      draggable="false"
                    />
                    {painted.photo === painted.base ? null : (
                      <img
                        className="lightbox-photo-full lightbox-photo-held absolute inset-0 size-full border-0 object-contain"
                        src={painted.photo}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                      />
                    )}
                  </>
                ) : null}
                <span
                  className="detail-photo-shimmer bg-skeleton"
                  aria-hidden="true"
                />
                </div>
              </div>
            </div>
            <figcaption className="m-0 self-start text-center text-sm leading-5 text-muted">
              {title}
            </figcaption>
          </motion.figure>

          {/* Outside the figure on purpose: Motion's entrance transform (and the
              frame growing to its aspect) make the figure a containing block, so
              absolute/fixed arrows nested inside it travel outward on first open.
              As siblings of the figure they pin to the full-screen overlay. */}
          {photos.length > 1 ? (
            <div
              className="lightbox-arrows"
              role="group"
              aria-label="Photo controls"
            >
              <IconButton
                className="lightbox-arrow lightbox-arrow-prev size-8"
                aria-label="Previous photo"
                variant="ghost"
                tone="ink"
                disabled={!hasPrevious}
                onClick={() => step(-1)}
              >
                <ChevronIcon direction="left" />
              </IconButton>
              <IconButton
                className="lightbox-arrow lightbox-arrow-next size-8"
                aria-label="Next photo"
                variant="ghost"
                tone="ink"
                disabled={!hasNext}
                onClick={() => step(1)}
              >
                <ChevronIcon direction="right" />
              </IconButton>
            </div>
          ) : null}

          <IconButton
            className="absolute top-[clamp(16px,3vw,32px)] right-[clamp(16px,3vw,32px)] size-8"
            aria-label="Close gallery"
            variant="ghost"
            tone="muted"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
