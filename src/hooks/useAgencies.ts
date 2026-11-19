import { useFetch } from "./useFetch";
import {
  agencyPropertiesUrl,
  agencyReviewsUrl,
  agencyUrl,
  type AgencyPageResponse,
  type ReviewListResponse,
} from "@/lib/api/agencies";
import type { PropertyListResponse } from "@/lib/api/properties";

export const AGENCY_PROPERTIES_PAGE_SIZE = 6;
export const REVIEWS_PAGE_SIZE = 5;

/** The agency's profile and its rating (average and number of reviews). */
export function useAgency(id: string) {
  const { data, error, isLoading, reload } = useFetch<AgencyPageResponse>(
    agencyUrl(id)
  );

  return {
    agency: data?.data.agency,
    rating: data?.data.rating,
    error,
    isLoading,
    reload,
  };
}

/** One page of the agency's published properties. */
export function useAgencyProperties(id: string, page: number) {
  const { data, error, isLoading, reload } = useFetch<PropertyListResponse>(
    agencyPropertiesUrl(id, page, AGENCY_PROPERTIES_PAGE_SIZE)
  );

  return { properties: data?.data, meta: data?.meta, error, isLoading, reload };
}

/** One page of the agency's reviews, newest first. */
export function useAgencyReviews(id: string, page: number) {
  const { data, error, isLoading, reload } = useFetch<ReviewListResponse>(
    agencyReviewsUrl(id, page, REVIEWS_PAGE_SIZE)
  );

  return { reviews: data?.data, meta: data?.meta, error, isLoading, reload };
}
