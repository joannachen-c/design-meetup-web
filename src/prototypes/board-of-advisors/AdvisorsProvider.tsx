"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  EMPTY_ADVISOR_FILTERS,
  advisorFieldOptions,
  advisorFiltersFromSearchParams,
  filterAdvisors,
  hasActiveAdvisorFilters,
  writeAdvisorFiltersToSearchParams,
  type Advisor,
  type AdvisorFilters,
} from "@/lib/advisor-directory";
import type { AdvisorsSource } from "@/lib/advisors";

type AdvisorsContextValue = {
  allAdvisors: Advisor[];
  advisors: Advisor[];
  fieldOptions: string[];
  filters: AdvisorFilters;
  isFiltered: boolean;
  source: AdvisorsSource;
  setFilters: (update: Partial<AdvisorFilters>) => void;
  clearFilters: () => void;
};

const AdvisorsContext = createContext<AdvisorsContextValue | null>(null);

export function AdvisorsProvider({
  advisors: allAdvisors,
  source,
  children,
}: {
  advisors: Advisor[];
  source: AdvisorsSource;
  children: ReactNode;
}) {
  const [filters, setFilterState] = useState<AdvisorFilters>(EMPTY_ADVISOR_FILTERS);

  useEffect(() => {
    setFilterState(advisorFiltersFromSearchParams(new URLSearchParams(window.location.search)));
  }, []);

  const setFilters = useCallback((update: Partial<AdvisorFilters>) => {
    setFilterState((current) => {
      const next = { ...current, ...update };
      const url = new URL(window.location.href);
      writeAdvisorFiltersToSearchParams(url.searchParams, next);
      window.history.replaceState(null, "", url);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_ADVISOR_FILTERS), [setFilters]);

  const value = useMemo<AdvisorsContextValue>(
    () => ({
      allAdvisors,
      advisors: filterAdvisors(allAdvisors, filters),
      fieldOptions: advisorFieldOptions(allAdvisors),
      filters,
      isFiltered: hasActiveAdvisorFilters(filters),
      source,
      setFilters,
      clearFilters,
    }),
    [allAdvisors, filters, source, setFilters, clearFilters],
  );

  return <AdvisorsContext.Provider value={value}>{children}</AdvisorsContext.Provider>;
}

export function useAdvisors() {
  const context = useContext(AdvisorsContext);
  if (!context) throw new Error("useAdvisors must be used inside <AdvisorsProvider>");
  return context;
}
