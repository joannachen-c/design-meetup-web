"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";

const nav = [
  { href: "/portal", label: "Home" },
  { href: "/portal/membership", label: "Membership" },
] as const;

export function PortalHeader({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-5 flex flex-wrap items-center justify-between gap-4 bg-surface px-[clamp(20px,6vw,96px)] py-[clamp(16px,2vw,24px)]">
      <Link
        href="/portal"
        className="text-lg font-bold leading-none tracking-[-0.06em] text-ink no-underline"
      >
        design meetup
      </Link>
      <nav className="flex flex-wrap gap-1" aria-label="Member portal">
        {nav.map((item) => {
          const on =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href) ||
                (item.href === "/portal/membership" &&
                  pathname.startsWith("/portal/subscribe"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex min-h-11 items-center rounded-[10px] px-4 text-base font-bold no-underline",
                on
                  ? "bg-ink text-white"
                  : "bg-transparent text-ink hover:bg-surface-muted",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
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
          <span className="text-base font-bold text-ink">{displayName}</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] border-0 bg-transparent px-4 text-base text-muted hover:bg-surface-muted hover:text-ink"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
