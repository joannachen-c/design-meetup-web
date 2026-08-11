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

const footerLinkClassName =
  "rounded-sm text-muted no-underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const footerCreditLinkClassName = `${footerLinkClassName} text-medium`;

type SiteFooterProps = {
  logoHref?: string;
  logoAriaLabel?: string;
};

export function SiteFooter({
  logoHref = "/design-system",
  logoAriaLabel = "Design Meetup design system",
}: SiteFooterProps) {
  return (
    <footer
      className="relative bg-surface px-[clamp(20px,6vw,96px)] pt-[clamp(48px,6.5vw,96px)] pb-[clamp(40px,5vw,72px)] text-base text-body"
      id="contact"
    >
      {/* Out of the grid flow so the hairline sits on the footer's top edge
          without adding a row. The top padding above mirrors the founders
          note's bottom padding, which is what centers the hairline. */}
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
            <ArrowUpRightIcon className="size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
          </a>
          <div className="footer-contact-row flex items-center gap-6">
            <a
              aria-label="Substack"
              className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
              href="https://designmeetup.substack.com/"
              target="_blank"
              rel="noreferrer"
            >
              <SubstackIcon />
            </a>
            <a
              aria-label="Instagram"
              className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
              href="https://www.instagram.com/designmeetup/"
              target="_blank"
              rel="noreferrer"
            >
              <InstagramIcon />
            </a>
            <a
              aria-label="LinkedIn"
              className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
              href="https://www.linkedin.com/company/design-meetup/"
              target="_blank"
              rel="noreferrer"
            >
              <LinkedInIcon />
            </a>
            <a
              aria-label="X"
              className={`${footerLinkClassName} inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4`}
              href="https://x.com/designmeetuphq"
              target="_blank"
              rel="noreferrer"
            >
              <XIcon />
            </a>
          </div>
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
        </div>
      </ScrollReveal>
    </footer>
  );
}
