"use client";

import type { CSSProperties } from "react";
import { Primary } from "../Primary";
import { ScrollReveal } from "../ScrollReveal";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader, type SiteHeaderLink } from "../SiteHeader";
import { AdvisorWall } from "./AdvisorWall";
import { TalentContactForm } from "./TalentContactForm";
import {
  ADVISOR_COUNT,
  candidateSignals,
  dinnerRunOfShow,
  dinnerThemes,
  hubCities,
  networkFirstMonth,
  processSteps,
  seniorityLevels,
} from "./talent-content";
import { siteEmail } from "@/lib/site";
import styles from "./TalentPage.module.css";

const talentHeaderLinks: SiteHeaderLink[] = [
  { href: "#network", label: "Network" },
  { href: "#seniority", label: "Seniority" },
  { href: "#formats", label: "Formats" },
  { href: "#process", label: "Process" },
  { href: "#get-matched", label: "Get matched" },
];

const sectionPadding = "px-[clamp(20px,6vw,96px)]";

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
      <main className="bg-surface text-ink">
        <section
          className={`${styles.grid} ${styles.hero} ${sectionPadding} pt-[clamp(32px,6vw,96px)] pb-[clamp(72px,9vw,140px)]`}
          aria-labelledby="talent-title"
        >
          <ScrollReveal className={styles.heroCopy}>
            <h1 className={styles.heroTitle} id="talent-title">
              Talent Network
            </h1>
            <p className={`${lede} text-[1.125rem]`}>
              We match your team with vetted Senior, Staff and Principal
              designers in San Francisco, Los Angeles and New York. Every one
              comes through a community of 10,000+ and a Board of Advisors of{" "}
              {ADVISOR_COUNT} design leaders, so you meet people someone you
              trust already rates.
            </p>
            <div className="flex flex-wrap gap-3">
              <Primary href="#get-matched">Get matched</Primary>
              <Primary href="#formats" variant="secondary">
                See the formats
              </Primary>
            </div>
          </ScrollReveal>

          <ScrollReveal className={styles.cities} delay={80}>
            <ul className={styles.cityList} aria-label="Hub cities">
              {hubCities.map((city) => (
                <li key={city.code} className={styles.city}>
                  <span className="text-sm tracking-[0.04em] text-subtle text-medium">
                    {city.code}
                  </span>
                  <span className={styles.cityName}>{city.name}</span>
                  <span className="text-base leading-[1.4] text-muted">
                    {city.scene}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </section>

        <section
          className={`${sectionPadding} pb-[clamp(80px,10vw,160px)]`}
          id="network"
          aria-labelledby="network-title"
        >
          <ScrollReveal className={styles.wallHeader}>
            <h2
              className="m-0 text-base font-normal text-muted text-medium"
              id="network-title"
            >
              Where our Board of Advisors designs
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={60}>
            <AdvisorWall />
          </ScrollReveal>
        </section>

        <section
          className={`${styles.grid} ${sectionPadding} pb-[clamp(80px,10vw,160px)]`}
          id="seniority"
          aria-labelledby="seniority-title"
        >
          <ScrollReveal className={styles.splitCopy}>
            <h2 className={sectionTitle} id="seniority-title">
              Senior and up.
            </h2>
            <p className={lede}>
              The network is built for the hires that are hardest to make cold:
              senior individual contributors, design engineers and the people
              who lead design teams.
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {candidateSignals.map((signal) => (
                <li
                  key={signal}
                  className="flex items-start gap-2.5 text-base leading-[1.4] text-ink"
                >
                  <span className="mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-full bg-accent-primary">
                    <CheckIcon className="size-3" />
                  </span>
                  {signal}
                </li>
              ))}
            </ul>
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
                  <span className="rounded-full border border-gray-200 px-2.5 py-1 text-sm leading-none text-muted">
                    {rung.track}
                  </span>
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
                <span className="w-fit rounded-full bg-white px-3 py-1.5 text-sm leading-none text-ink text-medium">
                  Always on
                </span>
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
              <div className={styles.formatFoot}>
                <span className="text-sm text-subtle">How it works</span>
                <span className="text-base text-ink text-medium">
                  Referral fee, paid only when you hire
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal
              className={`${styles.formatCard} ${styles.formatCardInk}`}
              delay={80}
            >
              <div className="flex flex-col gap-4">
                <span className="w-fit rounded-full bg-accent-primary px-3 py-1.5 text-sm leading-none text-ink text-medium">
                  Signature event
                </span>
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
              <div className="grid gap-3">
                <span className="text-sm text-white/50">Sample themes</span>
                <ul className={styles.themes}>
                  {dinnerThemes.map((theme) => (
                    <li key={theme.title}>
                      <span className="text-medium">{theme.title}</span>
                      <span className="text-white/60">{theme.blurb}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.formatFoot}>
                <span className="text-sm text-white/50">How it works</span>
                <span className="text-base text-white text-medium">
                  Event partnership, invite-only guest list
                </span>
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
              <p className={styles.processStat}>
                <span className={styles.processStatValue}>~2 weeks</span>
                <span className="text-base leading-[1.4] text-muted">
                  from kickoff to your first shortlist
                </span>
              </p>
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
                    <span className={styles.timelineWhen}>{step.when}</span>
                    <span className={styles.timelineTitle}>{step.title}</span>
                    {"milestone" in step ? (
                      <span className="rounded-full bg-accent-primary px-2.5 py-1 text-sm leading-none text-ink text-medium">
                        {step.milestone}
                      </span>
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
            <p className="m-0 text-base leading-[1.6] text-muted">
              Senior designer looking for your next role?{" "}
              <a
                className="text-ink text-medium underline decoration-gray-300 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                href={`mailto:${siteEmail}?subject=${encodeURIComponent("Talent Network — designer")}`}
              >
                Join the network
              </a>
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
