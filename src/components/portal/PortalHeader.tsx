"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      <nav className="flex gap-1" aria-label="Member portal">
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
                "inline-flex min-h-11 items-center whitespace-nowrap rounded-[10px] px-4 text-base font-bold no-underline max-[640px]:px-3",
                active
                  ? "bg-ink text-white"
                  : "bg-transparent text-ink hover:bg-surface-muted",
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
