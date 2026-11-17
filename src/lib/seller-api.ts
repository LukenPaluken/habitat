import { qs, request, type PageMeta } from "./api";
import type {
  ApiActivity,
  ApiAgency,
  ApiComment,
  ApiImage,
  ApiProperty,
  ApiPropertyDetail,
  ApiReports,
  ApiVisit,
  PropertyStatus,
  VisitRequestStatus,
} from "./seller-types";

// Un wrapper por endpoint del vendedor (ver "Seller" en el README).

export type PropertySort =
  | "date_desc"
  | "date_asc"
  | "price_asc"
  | "price_desc"
  | "area_desc"
  | "area_asc";

type Paging = { page?: number; limit?: number };

// --- inmobiliaria ----------------------------------------------------------------

export const agencyApi = {
  get: () => request<ApiAgency>("GET", "/api/agencies/me"),
  update: (patch: {
    description?: string;
    phone?: string;
    address?: string | null;
    logoUrl?: string | null;
  }) => request<ApiAgency>("PATCH", "/api/agencies/me", patch),
  remove: () => request<unknown>("DELETE", "/api/agencies/me"),
};

// --- propiedades -----------------------------------------------------------------

export type PropertyPayload = {
  title: string;
  description: string;
  propertyType: string;
  operationType: string;
  price: number;
  currency: string;
  address: string;
  neighborhood: string;
  totalArea: number | null;
  coveredArea: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  age: number | null;
  tags: string[];
};

export const propertyApi = {
  list: (params: Paging & { status?: PropertyStatus; sort?: PropertySort }) =>
    request<ApiProperty[], PageMeta>(
      "GET",
      `/api/agencies/me/properties${qs(params)}`
    ),
  get: (id: string) =>
    request<ApiPropertyDetail>("GET", `/api/properties/${id}`),
  create: (payload: PropertyPayload & { status: "BORRADOR" | "PUBLICADA" }) =>
    request<ApiProperty>("POST", "/api/properties", payload),
  update: (id: string, payload: PropertyPayload) =>
    request<ApiProperty>("PATCH", `/api/properties/${id}`, payload),
  removeDraft: (id: string) =>
    request<unknown>("DELETE", `/api/properties/${id}`),
  changeStatus: (id: string, status: PropertyStatus) =>
    request<ApiProperty>("PATCH", `/api/properties/${id}/status`, { status }),
  addImage: (id: string, imageUrl: string) =>
    request<ApiImage>("POST", `/api/properties/${id}/images`, { imageUrl }),
  removeImage: (id: string, imageId: string) =>
    request<unknown>("DELETE", `/api/properties/${id}/images/${imageId}`),
  setCover: (id: string, imageId: string) =>
    request<unknown>("PATCH", `/api/properties/${id}/images/${imageId}/cover`),
};

// --- visitas ---------------------------------------------------------------------

export const visitApi = {
  list: (params: Paging & { status?: VisitRequestStatus }) =>
    request<ApiVisit[], PageMeta>(
      "GET",
      `/api/agencies/me/visits${qs(params)}`
    ),
  changeStatus: (
    id: string,
    status: Exclude<VisitRequestStatus, "Pendiente">
  ) => request<ApiVisit>("PATCH", `/api/visits/${id}/status`, { status }),
};

// --- consultas -------------------------------------------------------------------

export const commentApi = {
  list: (params: Paging & { unanswered?: boolean }) =>
    request<ApiComment[], PageMeta & { unanswered: number }>(
      "GET",
      `/api/agencies/me/comments${qs({
        ...params,
        unanswered: params.unanswered ? "true" : undefined,
      })}`
    ),
  reply: (id: string, sellerReply: string) =>
    request<ApiComment>("POST", `/api/comments/${id}/reply`, { sellerReply }),
};

// --- actividad -------------------------------------------------------------------

export const activityApi = {
  list: (params: Paging & { unread?: boolean }) =>
    request<ApiActivity[], PageMeta & { unreadCount: number }>(
      "GET",
      `/api/agencies/me/activities${qs({
        ...params,
        unread: params.unread ? "true" : undefined,
      })}`
    ),
  markRead: (id: string) =>
    request<ApiActivity>("PATCH", `/api/agencies/me/activities/${id}/read`),
  markAllRead: () =>
    request<{ updated: number }>(
      "PATCH",
      "/api/agencies/me/activities/read-all"
    ),
};

// --- reportes --------------------------------------------------------------------

export const reportApi = {
  get: () => request<ApiReports>("GET", "/api/agencies/me/reports"),
};
