"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons/MenuIcon";
import { IconButton } from "./IconButton";
import { ScrollReveal } from "./ScrollReveal";

export type SiteHeaderLink = {
  href: string;
  label: string;
};

export const homeHeaderLinks: SiteHeaderLink[] = [
  { href: "#calendar", label: "Calendar" },
  { href: "#about", label: "About" },
  { href: "#sponsor", label: "Sponsor" },
  { href: "#apply", label: "Join Us" },
  { href: "/login", label: "Login" },
];

const navLinkClassName =
  "site-header-nav-link whitespace-nowrap text-medium text-base text-subtle no-underline hover:text-ink focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4 max-[820px]:flex max-[820px]:min-h-11 max-[820px]:items-center max-[820px]:rounded-[10px] max-[820px]:px-3 max-[820px]:text-ink max-[820px]:hover:bg-surface-muted max-[820px]:hover:text-ink";

export function SiteHeader({
  homeHref = "/",
  links = homeHeaderLinks,
  navAriaLabel = "Primary navigation",
  navClassName = "",
  reveal = false,
}: {
  homeHref?: string;
  links?: SiteHeaderLink[];
  navAriaLabel?: string;
  navClassName?: string;
  reveal?: boolean;
}) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const onChange = () => {
      if (!media.matches) setMenuOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const logo = (
    <a
      className="wordmark leading-[0] no-underline focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
      href={homeHref}
      aria-label="Design Meetup home"
    >
      <img
        className="wordmark-logo border-0 outline-none"
        src="/design-meetup-logo.png"
        alt=""
        width={60}
        height={60}
        decoding="async"
      />
    </a>
  );

  const navigation = (
    <div
      ref={menuRef}
      className={["site-header-actions", navClassName].filter(Boolean).join(" ")}
      data-open={menuOpen ? "true" : undefined}
    >
      <IconButton
        className="site-header-menu-toggle"
        variant="ghost"
        tone="subtle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
      <nav
        id={menuId}
        className="primary-navigation"
        aria-label={navAriaLabel}
      >
        {links.map((link) => (
          <a
            key={link.href}
            className={navLinkClassName}
            href={link.href}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );

  return (
    <header className="site-header px-[clamp(20px,6vw,96px)] pt-[clamp(16px,2vw,30px)] pb-[clamp(24px,3vw,46px)] text-base">
      {reveal ? <ScrollReveal>{logo}</ScrollReveal> : logo}
      {reveal ? (
        <ScrollReveal delay={60}>{navigation}</ScrollReveal>
      ) : (
        navigation
      )}
    </header>
  );
}
