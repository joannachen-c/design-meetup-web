"use client";

import type { CSSProperties } from "react";
import { Pill } from "../Pill";
import { Primary } from "../Primary";
import { ScrollReveal } from "../ScrollReveal";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader, type SiteHeaderLink } from "../SiteHeader";
import { AdvisorWall } from "./AdvisorWall";
import { LogoGlobe } from "./LogoGlobe";
import { TalentContactForm } from "./TalentContactForm";
import {
  dinnerRunOfShow,
  hubCities,
  networkFirstMonth,
  processSteps,
  seniorityLevels,
} from "./talent-content";
import styles from "./TalentPage.module.css";

const talentHeaderLinks: SiteHeaderLink[] = [
  { href: "#network", label: "Network" },
  { href: "#seniority", label: "Seniority" },
  { href: "#formats", label: "Formats" },
  { href: "#process", label: "Process" },
  { href: "#get-matched", label: "Get matched" },
];

const sectionPadding = "px-[clamp(20px,6vw,96px)]";

// The breathing room above the two list sections, shared so they stay in step.
const sectionGap = "pt-[clamp(120px,14vw,220px)]";

const sectionTitle =
  "m-0 text-balance text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.06em] text-black max-[520px]:text-[clamp(2.75rem,12vw,3.75rem)]";

const lede = "m-0 max-w-[54ch] text-pretty text-base leading-[1.6] text-muted";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`size-4 shrink-0 ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function TalentPage() {
  return (
    <>
      <SiteHeader links={talentHeaderLinks} navAriaLabel="Talent Network" />
      {/* clip, not the global hidden: hidden makes main a scroll container,
          which would pin the logo list's sticky caption to main instead of
          the viewport. */}
      <main className="bg-surface text-ink" style={{ overflow: "clip" }}>
        <section
          className={`${styles.grid} ${styles.hero} ${sectionPadding} pt-8 pb-[clamp(72px,9vw,140px)] min-[821px]:pt-0`}
          aria-labelledby="talent-title"
        >
          <ScrollReveal className={styles.heroCopy}>
            <div className={styles.heroIntro}>
              <h1 className={styles.heroTitle} id="talent-title">
                Talent Network
              </h1>
              <p className={`${lede} text-[1.125rem]`}>
                We match your team with vetted designers of all levels
                nationwide. Every one comes through a trusted design community.
              </p>
              <div className="flex flex-wrap gap-3">
                <Primary href="#get-matched" variant="ink">
                  Get matched
                </Primary>
                <Primary href="#formats" variant="secondary">
                  See the formats
                </Primary>
              </div>
            </div>
            <ul className={styles.cityList} aria-label="Hub cities">
              {hubCities.map((city) => (
                <li key={city.code} className={styles.cityName}>
                  {city.name}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal className={styles.heroGlobe} delay={120}>
            <LogoGlobe />
          </ScrollReveal>
        </section>

        <section
          className={`${sectionPadding} ${sectionGap}`}
          id="network"
          aria-labelledby="network-title"
        >
          <AdvisorWall />
        </section>

        <section
          className={`${styles.grid} ${sectionPadding} ${sectionGap} pb-[clamp(80px,10vw,160px)]`}
          id="seniority"
          aria-labelledby="seniority-title"
        >
          <ScrollReveal className={styles.splitCopy}>
            <h2 className={sectionTitle} id="seniority-title">
              Design at all levels
            </h2>
            <p className={lede}>
              From product designers to staff ICs, design engineers and the
              people who lead design teams, matched to the role you’re hiring
              for.
            </p>
          </ScrollReveal>
          <ScrollReveal className={styles.splitAside} delay={80}>
            <ol className={styles.ladder} aria-label="Seniority levels">
              {seniorityLevels.map((rung, index) => (
                <li key={rung.level} className={styles.rung}>
                  <span className={styles.rungMeter} aria-hidden="true">
                    {seniorityLevels.map((_, bar) => (
                      <span key={bar} data-on={bar <= index || undefined} />
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className={styles.rungTitle}>{rung.level}</span>
                    <span className="text-base leading-[1.4] text-muted">
                      {rung.positions}
                    </span>
                  </span>
                  <Pill>{rung.track}</Pill>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </section>

        <section
          className={`${styles.grid} ${sectionPadding} pb-[clamp(80px,10vw,160px)]`}
          id="formats"
          aria-labelledby="formats-title"
        >
          <ScrollReveal className={styles.sectionIntro}>
            <h2 className={sectionTitle} id="formats-title">
              Two ways to hire
            </h2>
            <p className={lede}>
              Keep the network on in the background, or bring the best
              candidates to one table. Most teams start with one and add the
              other.
            </p>
          </ScrollReveal>

          <div className={styles.formats}>
            <ScrollReveal className={`${styles.formatCard} bg-surface-muted`}>
              <div className="flex flex-col gap-4">
                <Pill variant="white">Always on</Pill>
                <h3 className={styles.formatTitle}>The Network</h3>
                <p className="m-0 text-base leading-[1.6] text-muted">
                  Ongoing access to a curated bench of senior designers,
                  refreshed as your roles open. We shortlist, you choose, we
                  make the warm intro.
                </p>
              </div>
              <ul className={styles.formatList}>
                {[
                  "A shortlist of 5–8 vetted designers per role",
                  "Warm 1:1 intros with your design team",
                  "Advisor input on role calibration",
                  "Pipeline refreshed until the role is filled",
                ].map((item) => (
                  <li key={item}>
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="grid gap-3">
                <span className="text-sm text-subtle">Sample first month</span>
                <ol className={`${styles.runOfShow} ${styles.runOfShowLight}`}>
                  {networkFirstMonth.map((slot) => (
                    <li key={slot.when}>
                      <span className="text-subtle">{slot.when}</span>
                      <span>{slot.item}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.formatTerms}>
                <span className="text-sm text-muted text-medium">
                  How it works
                </span>
                <p className={styles.formatTermsLead}>
                  Referral fee, paid only when you hire
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal
              className={`${styles.formatCard} ${styles.formatCardInk}`}
              delay={80}
            >
              <div className="flex flex-col gap-4">
                <Pill variant="accent">Signature event</Pill>
                <h3 className={styles.formatTitle}>The Hiring Dinner</h3>
                <p className="m-0 text-base leading-[1.6] text-white/65">
                  An intimate dinner co-hosted with your team: pre-matched
                  conversations, a short product demo and our advisors in the
                  room.
                </p>
              </div>
              <div className="grid gap-3">
                <span className="text-sm text-white/50">Sample run of show</span>
                <ol className={styles.runOfShow}>
                  {dinnerRunOfShow.map((slot) => (
                    <li key={slot.time}>
                      <span className="tabular-nums text-white/50">
                        {slot.time}
                      </span>
                      <span>{slot.item}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.formatTerms}>
                <span className="text-sm text-white/60 text-medium">
                  How it works
                </span>
                <p className={styles.formatTermsLead}>
                  Event partnership: you co-host, we curate the room
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section
          className={`${styles.grid} ${sectionPadding} pb-[clamp(80px,10vw,160px)]`}
          id="process"
          aria-labelledby="process-title"
        >
          <ScrollReveal className={styles.processPanel}>
            <div className={styles.processHead}>
              <div className="flex flex-col items-start gap-5">
                <h2 className={sectionTitle} id="process-title">
                  From kickoff to shortlist
                </h2>
                <p className={lede}>
                  Five steps, run with your design team and our advisors. You
                  only spend time on the conversations worth having.
                </p>
              </div>
            </div>
            <ol className={styles.timeline}>
              {processSteps.map((step, index) => (
                <li
                  key={step.title}
                  className={styles.timelineStep}
                  data-milestone={"milestone" in step || undefined}
                  style={{ "--step": index } as CSSProperties}
                >
                  <span className={styles.timelineNode} aria-hidden="true">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-2.5">
                    <span className={styles.timelineTitle}>{step.title}</span>
                    {"milestone" in step ? (
                      <Pill variant="accent">{step.milestone}</Pill>
                    ) : null}
                    <span className="text-base leading-[1.55] text-muted">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </section>

        <section
          className={`${styles.grid} ${sectionPadding} pb-[clamp(96px,11vw,180px)]`}
          id="get-matched"
          aria-labelledby="get-matched-title"
        >
          <ScrollReveal className={styles.ctaCopy}>
            <h2 className={sectionTitle} id="get-matched-title">
              Get matched
            </h2>
            <p className={lede}>
              Tell us about the role. We’ll reply with how we’d run the search
              and which format fits your team.
            </p>
          </ScrollReveal>
          <ScrollReveal className={styles.ctaForm} delay={80}>
            <TalentContactForm />
          </ScrollReveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
