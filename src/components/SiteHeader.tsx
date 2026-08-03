import { ScrollReveal } from "./ScrollReveal";

export type SiteHeaderLink = {
  href: string;
  label: string;
};

export const homeHeaderLinks: SiteHeaderLink[] = [
  { href: "#calendar", label: "CALENDAR" },
  { href: "#about", label: "ABOUT" },
  { href: "#sponsor", label: "SPONSOR" },
];

const navLinkClassName =
  "text-medium text-base text-muted no-underline hover:text-ink focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4";

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
    <nav
      className={["primary-navigation", navClassName].filter(Boolean).join(" ")}
      aria-label={navAriaLabel}
    >
      {links.map((link) => (
        <a key={link.href} className={navLinkClassName} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
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
