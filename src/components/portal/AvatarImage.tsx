"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type AvatarImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string;
  onFail: () => void;
};

function withRetry(src: string, attempt: number) {
  if (attempt === 0 || src.startsWith("blob:") || src.startsWith("data:")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`;
}

/**
 * A member photo that retries once and then hands off to a placeholder.
 * Server-rendered images can fail before React hydrates, and React never sees
 * that `error` event, so the element is checked again after mount.
 */
export function AvatarImage({ src, onFail, alt = "", ...props }: AvatarImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState({ src, count: 0 });
  const count = attempt.src === src ? attempt.count : 0;
  const current = withRetry(src, count);

  function fail() {
    const canRetry = count === 0 && current !== withRetry(src, 1);
    if (canRetry) setAttempt({ src, count: 1 });
    else onFail();
  }

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) fail();
  }, [current]);

  return <img ref={ref} src={current} alt={alt} onError={fail} {...props} />;
}
