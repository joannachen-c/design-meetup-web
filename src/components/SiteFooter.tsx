"use client";

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
  return (
    <footer
      className="relative bg-surface px-[clamp(20px,6vw,96px)] pt-[clamp(48px,6.5vw,96px)] pb-[clamp(40px,5vw,72px)] text-base text-body"
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
              <a
                className={footerCreditLinkClassName}
                href="/design-system"
                target="_blank"
                rel="noreferrer"
              >
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
