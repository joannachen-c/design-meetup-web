"use client";

import { useCallback, useEffect, useState } from "react";

import type { Advisor } from "@/lib/advisor-directory";
import type { AdvisorsSource } from "@/lib/advisors";

import { AdvisorsProvider } from "./AdvisorsProvider";
import { PrototypePicker } from "./PrototypePicker";
import { SectionContext } from "./SectionContext";
import { CardGridVariant } from "./variants/CardGridVariant";
import { CompactGridVariant } from "./variants/CompactGridVariant";
import { DirectoryVariant } from "./variants/DirectoryVariant";
import { GalleryStripVariant } from "./variants/GalleryStripVariant";
import { InlineLedgerVariant } from "./variants/InlineLedgerVariant";
import { RosterVariant } from "./variants/RosterVariant";

const variants = [
  { name: "Directory", Component: DirectoryVariant },
  { name: "Roster", Component: RosterVariant },
  { name: "Cards", Component: CardGridVariant },
  { name: "Compact", Component: CompactGridVariant },
  { name: "Ledger", Component: InlineLedgerVariant },
  { name: "Gallery", Component: GalleryStripVariant },
] as const;

function readInitialIndex() {
  if (typeof window === "undefined") return 0;
  const param = parseInt(new URLSearchParams(window.location.search).get("v") ?? "1", 10);
  if (Number.isNaN(param) || param < 1 || param > variants.length) return 0;
  return param - 1;
}

export function BoardOfAdvisorsPrototype({
  advisors,
  source,
}: {
  advisors: Advisor[];
  source: AdvisorsSource;
}) {
  const [current, setCurrent] = useState(0);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    setCurrent(readInitialIndex());
  }, []);

  const handleChange = useCallback((index: number) => {
    setCurrent(index);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(index + 1));
    window.history.replaceState(null, "", url);
    setMountKey((key) => key + 1);
  }, []);

  const handleReplay = useCallback(() => {
    setMountKey((key) => key + 1);
  }, []);

  const { Component } = variants[current];

  return (
    <AdvisorsProvider advisors={advisors} source={source}>
      <SectionContext key={mountKey}>
        <Component />
      </SectionContext>
      <PrototypePicker
        variants={variants}
        current={current}
        onChange={handleChange}
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
