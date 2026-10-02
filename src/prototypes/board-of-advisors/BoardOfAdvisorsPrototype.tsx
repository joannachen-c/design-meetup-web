"use client";

import { useCallback, useEffect, useState } from "react";

import type { Advisor } from "@/lib/advisor-directory";
import type { AdvisorsSource } from "@/lib/advisors";

import { AdvisorsDirectory } from "./AdvisorsDirectory";
import { AdvisorsProvider } from "./AdvisorsProvider";
import { ADVISOR_VIEWS, type AdvisorView } from "./AdvisorViewToggle";
import { PrototypePicker } from "./PrototypePicker";

const pickerViews = ADVISOR_VIEWS.map((view) => ({ name: view.label }));

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
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    document.getElementById("advisors")?.scrollIntoView({ block: "start" });
  }, []);

  const handleReplay = useCallback(() => {
    setMountKey((key) => key + 1);
  }, []);

  return (
    <AdvisorsProvider advisors={advisors} source={source}>
      <AdvisorsDirectory key={mountKey} view={view} onViewChange={setView} />
      <PrototypePicker
        variants={pickerViews}
        current={ADVISOR_VIEWS.findIndex((option) => option.value === view)}
        onChange={(index) => setView(ADVISOR_VIEWS[index].value)}
        onReplay={handleReplay}
        showReplay
        status={
          source === "supabase"
            ? { label: `Supabase · ${advisors.length}`, tone: "live" }
            : { label: "Bundled data", tone: "fallback" }
        }
      />
    </AdvisorsProvider>
  );
}
