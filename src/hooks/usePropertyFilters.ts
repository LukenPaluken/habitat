import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_FILTERS,
  filtersToQuery,
  parseFilters,
  type PropertyFilters,
} from "@/lib/property-filters";

/**
 * The Home page's filters, with the URL as the single source of truth: there
 * is no copy in component state to keep in sync, `filters` is read from the
 * address bar and every change is a navigation.
 */
export function usePropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Re-parse only when the query text really changes (a stable object to depend on).
  const queryText = searchParams.toString();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(queryText)),
    [queryText]
  );

  const navigate = useCallback(
    (next: PropertyFilters, mode: "push" | "replace") => {
      const query = filtersToQuery(next);
      router[mode](query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router]
  );

  /** Changes some filters. Any change but the page itself goes back to page 1. */
  const setFilters = useCallback(
    (patch: Partial<PropertyFilters>) => {
      const changesPage = "page" in patch;
      navigate(
        { ...filters, page: 1, ...patch },
        // Paging is something people go "back" from; refining a search is not.
        changesPage ? "push" : "replace"
      );
    },
    [filters, navigate]
  );

  /** Drops every filter but keeps the chosen order. */
  const clearFilters = useCallback(
    () => navigate({ ...DEFAULT_FILTERS, sort: filters.sort }, "replace"),
    [filters.sort, navigate]
  );

  return { filters, setFilters, clearFilters };
}
