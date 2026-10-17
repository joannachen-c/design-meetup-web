"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  "whitespace-nowrap text-medium text-base text-subtle no-underline hover:text-ink focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4";

const mobileNavLinkClassName =
  "site-header-menu-link block w-fit text-[clamp(2.25rem,9.5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink no-underline hover:text-muted focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4";

const panelEase = [0.22, 1, 0.36, 1] as const;
const linkEase = [0.22, 1, 0.36, 1] as const;

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
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("is-mobile-menu-open");
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.documentElement.classList.remove("is-mobile-menu-open");
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

  const closeMenu = () => setMenuOpen(false);

  const logo = (
    <a
      className="wordmark leading-[0] no-underline focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
      href={homeHref}
      aria-label="Design Meetup home"
      onClick={closeMenu}
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

  const actions = (
    <div
      className={["site-header-actions", navClassName].filter(Boolean).join(" ")}
      data-open={menuOpen ? "true" : undefined}
    >
      <IconButton
        className="site-header-menu-toggle relative z-[60]"
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
        className="primary-navigation site-header-desktop-nav"
        aria-label={navAriaLabel}
        aria-hidden={menuOpen || undefined}
      >
        {links.map((link) => (
          <a key={link.href} className={navLinkClassName} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );

  const mobileMenu =
    mounted &&
    createPortal(
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="site-header-menu"
            className="site-header-menu-panel fixed inset-0 z-50 box-border flex min-h-dvh w-full items-center justify-start bg-surface pt-[max(96px,env(safe-area-inset-top))] pr-[clamp(20px,6vw,96px)] pb-[max(48px,env(safe-area-inset-bottom))] pl-[clamp(20px,6vw,96px)]"
            role="dialog"
            aria-modal="true"
            aria-label={navAriaLabel}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: panelEase,
            }}
          >
            <nav
              id={menuId}
              className="site-header-menu-nav flex w-[min(100%,22rem)] flex-col items-start gap-[clamp(10px,2.4vh,22px)]"
              aria-label={navAriaLabel}
            >
              {links.map((link, index) => (
                <motion.a
                  key={link.href}
                  className={mobileNavLinkClassName}
                  href={link.href}
                  onClick={closeMenu}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 28, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: 0,
                          y: 8,
                          transition: { duration: 0.14, ease: "easeOut" },
                        }
                  }
                  transition={{
                    duration: reduceMotion ? 0 : 0.52,
                    delay: reduceMotion ? 0 : 0.08 + index * 0.055,
                    ease: linkEase,
                  }}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <header className="site-header px-[clamp(20px,6vw,96px)] pt-[clamp(16px,2vw,30px)] pb-[clamp(24px,3vw,46px)] text-base">
        {reveal ? <ScrollReveal>{logo}</ScrollReveal> : logo}
        {reveal ? (
          <ScrollReveal delay={60}>{actions}</ScrollReveal>
        ) : (
          actions
        )}
      </header>
      {mobileMenu}
    </>
  );
}
