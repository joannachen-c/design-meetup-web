"use client";

import { useCallback, useEffect, useState } from "react";

import type { Advisor } from "@/lib/advisor-directory";
import type { AdvisorsSource } from "@/lib/advisors";

import { AdvisorsDirectory } from "./AdvisorsDirectory";
import { AdvisorsProvider } from "./AdvisorsProvider";
import { ADVISOR_VIEWS, type AdvisorView } from "./AdvisorViewToggle";
import { PrototypePicker } from "./PrototypePicker";
import { SectionContext } from "./SectionContext";

const pickerViews = ADVISOR_VIEWS.map((view) => ({ name: view.label }));

function readInitialView(): AdvisorView {
  const param = new URLSearchParams(window.location.search).get("view");
  return ADVISOR_VIEWS.some((view) => view.value === param) ? (param as AdvisorView) : "table";
}

export function BoardOfAdvisorsPrototype({
  advisors,
  source,
}: {
  advisors: Advisor[];
  source: AdvisorsSource;
}) {
  const [view, setView] = useState<AdvisorView>("table");
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    setView(readInitialView());
  }, []);

  const handleViewChange = useCallback((next: AdvisorView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  }, []);

  const handleReplay = useCallback(() => {
    setMountKey((key) => key + 1);
  }, []);

  return (
    <AdvisorsProvider advisors={advisors} source={source}>
      <SectionContext key={mountKey}>
        <AdvisorsDirectory view={view} onViewChange={handleViewChange} />
      </SectionContext>
      <PrototypePicker
        variants={pickerViews}
        current={ADVISOR_VIEWS.findIndex((option) => option.value === view)}
        onChange={(index) => handleViewChange(ADVISOR_VIEWS[index].value)}
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
