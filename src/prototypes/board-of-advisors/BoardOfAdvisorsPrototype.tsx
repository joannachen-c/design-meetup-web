"use client";

import { useCallback, useEffect, useState } from "react";

import type { Advisor } from "@/lib/advisor-directory";
import type { AdvisorsSource } from "@/lib/advisors";

import { AdvisorsDirectory } from "./AdvisorsDirectory";
import { AdvisorsProvider } from "./AdvisorsProvider";
import { ADVISOR_VIEWS, type AdvisorView } from "./AdvisorViewToggle";

function readInitialView(): AdvisorView {
  const param = new URLSearchParams(window.location.search).get("view");
  return ADVISOR_VIEWS.some((view) => view.value === param) ? (param as AdvisorView) : "table";
}

function useAdvisorView() {
  const [view, setView] = useState<AdvisorView>("table");

  useEffect(() => {
    setView(readInitialView());
  }, []);

  const changeView = useCallback((next: AdvisorView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  }, []);

  return [view, changeView] as const;
}

type AdvisorsSectionProps = {
  advisors: Advisor[];
  source: AdvisorsSource;
};

export function BoardOfAdvisorsSection({ advisors, source }: AdvisorsSectionProps) {
  const [view, setView] = useAdvisorView();
  return (
    <AdvisorsProvider advisors={advisors} source={source}>
      <AdvisorsDirectory view={view} onViewChange={setView} />
    </AdvisorsProvider>
  );
}

export function BoardOfAdvisorsPrototype({ advisors, source }: AdvisorsSectionProps) {
  const [view, setView] = useAdvisorView();

  useEffect(() => {
    document.getElementById("advisors")?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <AdvisorsProvider advisors={advisors} source={source}>
      <AdvisorsDirectory view={view} onViewChange={setView} />
    </AdvisorsProvider>
  );
}
