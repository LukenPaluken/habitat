import type {
  AgencyPage,
  AgencyUpdate,
  ApiResponse,
  OwnAgency,
  RegisterInput,
  Review,
  ReviewInput,
  ReviewListResponse,
} from "@/types/api";
import { del, patch, post } from "./client";

// Agencies: the public site of a seller and the seller's own settings.

export type AgencyPageResponse = ApiResponse<AgencyPage>;
export type OwnAgencyResponse = ApiResponse<OwnAgency>;
export type { ReviewListResponse };

export const OWN_AGENCY_URL = "/api/agencies/me";

export const agencyUrl = (id: string) =>
  `/api/agencies/${encodeURIComponent(id)}`;

export const agencyPropertiesUrl = (id: string, page: number, limit: number) =>
  `${agencyUrl(id)}/properties?page=${page}&limit=${limit}`;

export const agencyReviewsUrl = (id: string, page: number, limit: number) =>
  `${agencyUrl(id)}/reviews?page=${page}&limit=${limit}`;

export const postReview = (agencyId: string, input: ReviewInput) =>
  post<Review>(`${agencyUrl(agencyId)}/reviews`, input);

// --- the seller ----------------------------------------------------------------------

export const registerSeller = (input: RegisterInput) =>
  // This endpoint answers `{ success, user, agency }`, not `{ data }`.
  post<unknown>("/api/auth/register-seller", input);

export const updateOwnAgency = (input: AgencyUpdate) =>
  patch<OwnAgency>(OWN_AGENCY_URL, input);

export const deleteOwnAgency = () => del(OWN_AGENCY_URL);
