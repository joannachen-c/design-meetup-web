"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  EMPTY_ADVISOR_FILTERS,
  advisorCompanyOptions,
  advisorFieldOptions,
  advisorLocationOptions,
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
  locationOptions: string[];
  companyOptions: string[];
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
  const hasReadUrl = useRef(false);

  useEffect(() => {
    setFilterState(advisorFiltersFromSearchParams(new URLSearchParams(window.location.search)));
  }, []);

  useEffect(() => {
    // The first pass holds EMPTY filters; writing them would wipe the incoming query string.
    if (!hasReadUrl.current) {
      hasReadUrl.current = true;
      return;
    }
    const url = new URL(window.location.href);
    writeAdvisorFiltersToSearchParams(url.searchParams, filters);
    window.history.replaceState(null, "", url);
  }, [filters]);

  const setFilters = useCallback((update: Partial<AdvisorFilters>) => {
    setFilterState((current) => ({ ...current, ...update }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_ADVISOR_FILTERS), [setFilters]);

  const value = useMemo<AdvisorsContextValue>(
    () => ({
      allAdvisors,
      advisors: filterAdvisors(allAdvisors, filters),
      fieldOptions: advisorFieldOptions(allAdvisors),
      locationOptions: advisorLocationOptions(allAdvisors),
      companyOptions: advisorCompanyOptions(allAdvisors),
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
