"use client";

import { useRef, useState } from "react";
import { usePropertyFilters } from "@/hooks/usePropertyFilters";
import { useProperties } from "@/hooks/useProperties";
import { countActiveFilters } from "@/lib/property-filters";
import { FiltersPanel } from "./filters/FiltersPanel";
import { SearchBar } from "./filters/SearchBar";
import { PropertyResults } from "./PropertyResults";
import { ResultsHeader } from "./ResultsHeader";

const FILTERS_ID = "property-filters";

/** The Home screen: search, combined filters, sorting and paginated results. */
export function PropertyListing() {
  const { filters, setFilters, clearFilters } = usePropertyFilters();
  const { properties, meta, error, isLoading, reload } = useProperties(filters);

  const [filtersOpen, setFiltersOpen] = useState(false);
  // Text typed but not applied (too short, an invalid price...) never reached
  // the URL, so "Limpiar filtros" can't clear it from there. Bumping this key
  // remounts the inputs, which start again from the (empty) URL.
  const [clearCount, setClearCount] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Derived from the filters on every render; there is nothing to keep in sync.
  const activeFilters = countActiveFilters(filters);

  function clearAll() {
    clearFilters();
    setClearCount((count) => count + 1);
  }

  function goToPage(page: number) {
    setFilters({ page });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Encontrá tu próxima propiedad
        </h1>
        <p className="text-slate-600">
          Casas, departamentos, terrenos y locales en venta y alquiler.
        </p>
      </header>

      <div className="space-y-3">
        <SearchBar
          key={`search-${clearCount}`}
          value={filters.q}
          onSearch={(q) => setFilters({ q })}
          activeFilters={activeFilters}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
          filtersId={FILTERS_ID}
        />
        <FiltersPanel
          key={`filters-${clearCount}`}
          id={FILTERS_ID}
          filters={filters}
          onChange={setFilters}
          onClear={clearAll}
          activeFilters={activeFilters}
          open={filtersOpen}
        />
      </div>

      <div ref={resultsRef} className="scroll-mt-20 space-y-5">
        <ResultsHeader
          total={meta?.total}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ sort })}
        />
        <PropertyResults
          properties={properties}
          meta={meta}
          error={error}
          isLoading={isLoading}
          hasFilters={activeFilters > 0}
          onRetry={reload}
          onClearFilters={clearAll}
          onPageChange={goToPage}
        />
      </div>
    </div>
  );
}
