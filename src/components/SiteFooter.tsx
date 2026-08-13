"use client";

import { useEffect, useRef } from "react";

import { ArrowUpRightIcon } from "./icons/ArrowUpRightIcon";
import {
  InstagramIcon,
  LinkedInIcon,
  SubstackIcon,
  XIcon,
} from "./icons/SocialIcons";
import { NewsletterForm } from "./NewsletterForm";
import { ScrollReveal } from "./ScrollReveal";
import { Tooltip, TooltipProvider } from "./Tooltip";

/** Wheel delta → virtual overscroll scale (trackpads send large deltas). */
const FOOTER_LOGO_OVERSCROLL_GAIN = 0.45;
/**
 * Quiet window before treating the gesture as done. Shorter than this and
 * trackpad event gaps clear mid-swipe; longer feels like a pause.
 */
const FOOTER_LOGO_OVERSCROLL_RELEASE_MS = 90;
/**
 * If a gesture still had this much page left when it began, the end bounce is
 * just arrival — skip the lift (they are not resting and rubber-banding).
 */
const FOOTER_LOGO_ARRIVAL_FROM_PX = 280;
/** Keep the nudge tiny so the settle plop stays quiet. */
const FOOTER_LOGO_LIFT_MAX_PX = 6;

const footerLinkClassName =
  "rounded-sm text-muted no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const footerCreditLinkClassName = `${footerLinkClassName} text-medium`;
const footerSocialLinkClassName = `${footerLinkClassName} group inline-flex rounded-sm focus-visible:outline-offset-4`;
const footerSocialIconClassName =
  "transition-colors duration-150 ease-out motion-reduce:transition-none";

const footerSocialLinks = [
  {
    label: "Substack",
    href: "https://designmeetup.substack.com/",
    icon: (
      <SubstackIcon
        className={`${footerSocialIconClassName} size-[18px] group-hover:text-[#FF6719] group-focus-visible:text-[#FF6719]`}
      />
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/designmeetup/",
    icon: (
      <span className="relative size-5">
        <InstagramIcon className="size-5 transition-opacity duration-150 ease-out group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none" />
        <InstagramIcon
          branded
          className="absolute inset-0 size-5 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        />
      </span>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/design-meetup/",
    icon: (
      <LinkedInIcon
        className={`${footerSocialIconClassName} size-5 group-hover:text-[#0A66C2] group-focus-visible:text-[#0A66C2]`}
      />
    ),
  },
  {
    label: "X",
    href: "https://x.com/designmeetuphq",
    icon: (
      <XIcon
        className={`${footerSocialIconClassName} size-[18px] group-hover:text-ink group-focus-visible:text-ink`}
      />
    ),
  },
] as const;

type SiteFooterProps = {
  logoHref?: string;
  logoAriaLabel?: string;
  hideDesignSystemPromo?: boolean;
};

export function SiteFooter({
  logoHref = "/design-system",
  logoAriaLabel = "Design Meetup design system",
  hideDesignSystemPromo = false,
}: SiteFooterProps) {
  const logoRef = useRef<HTMLAnchorElement>(null);

  // The mark intentionally bleeds past the footer edge at rest. A deliberate
  // overscroll while already near the bottom nudges it clear of the hard cut;
  // a long scroll that merely arrives at the end does not — that bounce is
  // arrival, not rubber-banding in place. The nudge stays small so the settle
  // plop stays quiet.
  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;
    const footer = logo.closest("footer");
    const brand = logo.closest(".footer-brand");
    if (!footer || !brand) return;

    const stacked = window.matchMedia("(max-width: 820px)");
    let overscroll = 0;
    let lastWheelAt = 0;
    let frame = 0;
    let settling = false;
    /** Furthest-from-bottom distance seen in the current wheel gesture. */
    let gestureMaxRemaining = 0;

    const naturalClipPx = () => {
      const naturalBottom =
        brand.getBoundingClientRect().top + logo.offsetHeight;
      return Math.max(
        0,
        Math.ceil(naturalBottom - footer.getBoundingClientRect().bottom),
      );
    };

    const maxLiftPx = () => {
      const clip = naturalClipPx();
      return clip > 0 ? Math.min(clip, FOOTER_LOGO_LIFT_MAX_PX) : 0;
    };

    const scrollMetrics = () => {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const remaining = Math.max(0, maxScroll - window.scrollY);
      return { maxScroll, remaining, atEnd: remaining <= 1 };
    };

    const endSettle = (event: TransitionEvent) => {
      if (event.propertyName !== "translate") return;
      settling = false;
      logo.classList.remove("is-settling");
    };

    const trackLift = (lift: number) => {
      settling = false;
      logo.classList.remove("is-settling");
      logo.classList.add("is-overscrolling");
      logo.style.setProperty("--footer-logo-lift", `${-lift}px`);
    };

    const settleLift = () => {
      if (overscroll <= 0 && !logo.classList.contains("is-overscrolling")) {
        return;
      }
      overscroll = 0;
      lastWheelAt = 0;
      settling = true;
      // Settling must win over tracking so the drop eases instead of snapping
      // through the base 150ms hover curve.
      logo.classList.add("is-settling");
      logo.classList.remove("is-overscrolling");
      logo.style.setProperty("--footer-logo-lift", "0px");
    };

    const resetLift = () => {
      overscroll = 0;
      lastWheelAt = 0;
      settling = false;
      gestureMaxRemaining = 0;
      logo.classList.remove("is-overscrolling", "is-settling");
      logo.style.setProperty("--footer-logo-lift", "0px");
    };

    const tick = (now: number) => {
      frame = 0;
      if (stacked.matches) {
        resetLift();
        return;
      }

      if (overscroll > 0 && now - lastWheelAt > FOOTER_LOGO_OVERSCROLL_RELEASE_MS) {
        settleLift();
        return;
      }

      if (overscroll > 0) {
        trackLift(Math.min(overscroll, maxLiftPx()));
        frame = requestAnimationFrame(tick);
      }
    };

    const armTick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (stacked.matches) return;

      const now = performance.now();
      const { remaining, atEnd } = scrollMetrics();

      // New gesture after a quiet stretch — remember how far from the end we were.
      if (now - lastWheelAt > FOOTER_LOGO_OVERSCROLL_RELEASE_MS) {
        gestureMaxRemaining = remaining;
      } else {
        gestureMaxRemaining = Math.max(gestureMaxRemaining, remaining);
      }

      // Rebound / upward deltas fire during rubber-band recovery — ignoring
      // them keeps the mark from yanking down mid-bounce.
      if (event.deltaY <= 0) {
        lastWheelAt = now;
        return;
      }

      lastWheelAt = now;

      if (!atEnd) {
        if (overscroll > 0 || settling) settleLift();
        return;
      }

      // Arrived from high on the page in this gesture — skip the end-bounce nudge.
      if (gestureMaxRemaining > FOOTER_LOGO_ARRIVAL_FROM_PX) return;

      const cap = maxLiftPx();
      if (cap <= 0) return;

      overscroll = Math.min(
        cap,
        Math.max(overscroll, 0) + event.deltaY * FOOTER_LOGO_OVERSCROLL_GAIN,
      );
      trackLift(overscroll);
      armTick();
    };

    resetLift();
    logo.addEventListener("transitionend", endSettle);
    window.addEventListener("wheel", onWheel, { passive: true });
    stacked.addEventListener("change", resetLift);

    return () => {
      cancelAnimationFrame(frame);
      logo.removeEventListener("transitionend", endSettle);
      window.removeEventListener("wheel", onWheel);
      stacked.removeEventListener("change", resetLift);
    };
  }, []);

  return (
    <footer
      className="relative bg-surface px-[clamp(20px,6vw,96px)] pt-[clamp(48px,6.5vw,96px)] pb-[clamp(40px,5vw,72px)] text-base text-ink"
      id="contact"
    >
      {/* Out of the grid flow so the hairline sits on the footer's top edge
          without adding a row. The top padding mirrors the marquee's bottom
          padding, which is what centers the hairline. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[clamp(20px,6vw,96px)] top-0 h-px bg-skeleton"
      />
      <ScrollReveal className="footer-brand" repeat>
        <a
          ref={logoRef}
          aria-label={logoAriaLabel}
          className="footer-logo border-0 outline-none"
          href={logoHref}
        >
          <img
            className="size-full object-contain"
            src="/design-meetup-logo.svg"
            alt=""
            width={1000}
            height={1000}
            loading="lazy"
          />
        </a>
      </ScrollReveal>
      <ScrollReveal className="footer-contact" delay={60}>
        <h2 className="m-0 mb-5 text-xl font-bold tracking-[-0.06em] text-black">
          Contact
        </h2>
        <nav
          aria-label="Contact links"
          className="flex flex-col items-start gap-5"
        >
          <a
            className={`${footerLinkClassName} group inline-flex items-center gap-1 [overflow-wrap:anywhere]`}
            href="mailto:contactdesignmeetup@gmail.com"
          >
            contactdesignmeetup@gmail.com
            <ArrowUpRightIcon className="size-[18px] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
          </a>
          <TooltipProvider>
            <div className="footer-contact-row flex items-center gap-6">
              {footerSocialLinks.map(({ label, href, icon }) => (
                <Tooltip key={label} content={label}>
                  <a
                    aria-label={label}
                    className={footerSocialLinkClassName}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {icon}
                  </a>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </nav>
      </ScrollReveal>
      <ScrollReveal className="footer-newsletter" delay={120}>
        <h2 className="m-0 mb-5 text-xl font-bold tracking-[-0.06em] text-black">
          Join the newsletter
        </h2>
        <NewsletterForm />
      </ScrollReveal>
      <ScrollReveal className="footer-credit" delay={160}>
        <div className="flex flex-col gap-0 text-right text-base text-muted max-[820px]:text-left">
          <p className="m-0">
            Website built in{" "}
            <a
              className={footerCreditLinkClassName}
              href="https://nextjs.org/"
              target="_blank"
              rel="noreferrer"
            >
              Next.js
            </a>{" "}
            with{" "}
            <a
              className={footerCreditLinkClassName}
              href="https://cursor.com/"
              target="_blank"
              rel="noreferrer"
            >
              Cursor
            </a>{" "}
            and{" "}
            <a
              className={footerCreditLinkClassName}
              href="https://supabase.com/"
              target="_blank"
              rel="noreferrer"
            >
              Supabase
            </a>
            .
          </p>
          {!hideDesignSystemPromo && (
            <p className="m-0">
              Check out our{" "}
              <a className={footerCreditLinkClassName} href="/design-system">
                Design System
              </a>
              !
            </p>
          )}
        </div>
      </ScrollReveal>
    </footer>
  );
}
