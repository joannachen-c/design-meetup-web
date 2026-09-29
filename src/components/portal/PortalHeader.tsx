"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AvatarImage } from "@/components/portal/AvatarImage";
import { logoutAction } from "@/lib/auth-actions";

const nav = [
  { href: "/portal", label: "Home" },
  { href: "/portal/community", label: "Community" },
] as const;

function Avatar({ url }: { url?: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  return url && failed !== url ? (
    <AvatarImage
      src={url}
      className="block size-8 rounded-full object-cover"
      width={32}
      height={32}
      onFail={() => setFailed(url)}
    />
  ) : (
    <span className="block size-8 rounded-full bg-skeleton" aria-hidden />
  );
}

export function PortalHeader({
  displayName,
  avatarUrl,
  paid = true,
}: {
  displayName: string;
  avatarUrl?: string | null;
  paid?: boolean;
}) {
  const pathname = usePathname();
  // Portal pages other than subscribe already redirect unpaid members, and the
  // layout can check access before a Checkout return has synced membership.
  const showMemberNav = paid || !pathname.startsWith("/portal/subscribe");
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null,
  );
  const [pillReady, setPillReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
        href={showMemberNav ? "/portal" : "/portal/subscribe"}
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
      {showMemberNav ? (
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
      ) : (
        <span aria-hidden />
      )}
      <div className="flex items-center justify-end gap-2">
        {showMemberNav ? (
          <>
            <Link
              href="/portal/profile"
              aria-current={
                pathname.startsWith("/portal/profile") ? "page" : undefined
              }
              className={[
                "flex min-h-11 items-center gap-2.5 rounded-[10px] pl-1.5 pr-3 no-underline max-[640px]:hidden",
                pathname.startsWith("/portal/profile")
                  ? "bg-gray-100"
                  : "hover:bg-surface-muted",
              ].join(" ")}
            >
              <Avatar url={avatarUrl} />
              <span className="text-base font-bold text-ink">{displayName}</span>
            </Link>
            <form action={logoutAction} className="max-[640px]:hidden">
              <button
                type="submit"
                className="inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-[10px] border-0 bg-transparent px-4 text-base text-muted transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700"
              >
                Log out
              </button>
            </form>

            <div ref={menuRef} className="relative min-[641px]:hidden">
              <button
                type="button"
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Account menu for ${displayName}`}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <Avatar url={avatarUrl} />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute top-full right-0 z-10 mt-2 grid min-w-44 gap-1 rounded-[14px] bg-white p-1.5 shadow-[0_12px_32px_rgb(18_24_38/0.14)] ring-1 ring-black/5"
                >
                  <Link
                    role="menuitem"
                    href="/portal/profile"
                    className="flex min-h-11 items-center rounded-[10px] px-3 text-base font-bold text-ink no-underline hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <form action={logoutAction}>
                    <button
                      role="menuitem"
                      type="submit"
                      className="flex min-h-11 w-full cursor-pointer items-center rounded-[10px] border-0 bg-transparent px-3 text-left text-base text-muted transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-[10px] border-0 bg-transparent px-4 text-base text-muted transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700"
            >
              Log out
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
