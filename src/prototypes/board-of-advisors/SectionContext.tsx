import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Minimal homepage chrome so each variant reads in realistic context —
 * the section sits between About and Partner on the live site.
 */
export function SectionContext({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-surface font-['Alte_Haas_Grotesk',sans-serif] text-ink antialiased [font-synthesis:none]">
      <SiteHeader homeHref="/" reveal={false} />
      <div className="h-[clamp(80px,12vw,160px)] bg-surface px-[clamp(20px,6vw,96px)]">
        <p className="m-0 pt-[clamp(32px,5vw,80px)] text-base text-subtle">
          … About section above …
        </p>
      </div>
      {children}
      <div className="h-[clamp(80px,12vw,120px)] bg-surface px-[clamp(20px,6vw,96px)]">
        <p className="m-0 pt-8 text-base text-subtle">… Partner with us below …</p>
      </div>
      <SiteFooter logoHref="/" logoAriaLabel="Design Meetup home" hideDesignSystemPromo />
    </main>
  );
}
