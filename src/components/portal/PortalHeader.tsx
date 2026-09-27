"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/auth-actions";

const nav = [
  { href: "/portal", label: "Home" },
  { href: "/portal/events", label: "Events" },
] as const;

export function PortalHeader({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null,
  );
  const [pillReady, setPillReady] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const active = navRef.current?.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      setPill(
        active ? { left: active.offsetLeft, width: active.offsetWidth } : null,
      );
    };
    measure();
    // Skip the slide on first paint so the pill starts under the active tab.
    const frame = requestAnimationFrame(() => setPillReady(true));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [pathname]);

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-surface px-[clamp(20px,6vw,96px)] py-[clamp(16px,2vw,24px)]">
      <Link
        href="/portal"
        className="w-fit leading-[0] no-underline"
        aria-label="Design Meetup home"
      >
        <img
          className="block border-0 outline-none"
          src="/design-meetup-logo.png"
          alt=""
          width={48}
          height={48}
          decoding="async"
        />
      </Link>
      <nav
        ref={navRef}
        className="relative flex gap-1"
        aria-label="Member portal"
      >
        {pill ? (
          <span
            aria-hidden
            className={[
              "absolute inset-y-0 left-0 rounded-[10px] bg-gray-100",
              pillReady
                ? "transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                : "",
            ].join(" ")}
            style={{
              width: pill.width,
              transform: `translateX(${pill.left}px)`,
            }}
          />
        ) : null}
        {nav.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "relative inline-flex min-h-11 items-center whitespace-nowrap rounded-[10px] px-4 text-base font-bold no-underline transition-colors duration-200 max-[640px]:px-3",
                active ? "text-ink" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-end gap-1 sm:gap-2">
        <Link
          href="/portal/profile"
          className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-1.5 no-underline hover:bg-surface-muted"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="block size-8 rounded-full object-cover"
              width={32}
              height={32}
            />
          ) : (
            <span className="block size-8 rounded-full bg-skeleton" aria-hidden />
          )}
          <span className="text-base font-bold text-ink max-[640px]:sr-only">
            {displayName}
          </span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-[10px] border-0 bg-transparent px-4 text-base text-muted hover:bg-surface-muted hover:text-ink max-[640px]:px-2"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
