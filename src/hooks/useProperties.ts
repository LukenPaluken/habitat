import { useFetch } from "./useFetch";
import {
  propertiesUrl,
  propertyUrl,
  type PropertyDetailResponse,
  type PropertyListResponse,
} from "@/lib/api/properties";
import {
  filtersToQuery,
  PAGE_SIZE,
  type PropertyFilters,
} from "@/lib/property-filters";

/** One page of the public listing for these filters. */
export function useProperties(filters: PropertyFilters) {
  const { data, error, isLoading, reload } = useFetch<PropertyListResponse>(
    propertiesUrl(filtersToQuery(filters, { limit: PAGE_SIZE }))
  );

  return { properties: data?.data, meta: data?.meta, error, isLoading, reload };
}

/** The full detail of one property. */
export function useProperty(id: string) {
  const { data, error, isLoading, reload } = useFetch<PropertyDetailResponse>(
    propertyUrl(id)
  );

  return { property: data?.data, error, isLoading, reload };
}
