import type {
  ApiResponse,
  Comment,
  CommentInput,
  PaginatedResponse,
  PropertyDetail,
  PropertyInput,
  PropertyStatus,
  PropertySummary,
  PropertyImage,
  StatusChange,
  VisitRequestInput,
} from "@/types/api";
import { del, patch, post, put } from "./client";

// Properties: what the public sees and what the owner manages.

export type PropertyListResponse = PaginatedResponse<PropertySummary>;
export type PropertyDetailResponse = ApiResponse<PropertyDetail>;
export type StatusHistoryResponse = ApiResponse<StatusChange[]>;

export const propertiesUrl = (query: string) =>
  `/api/properties${query ? `?${query}` : ""}`;

export const propertyUrl = (id: string) =>
  `/api/properties/${encodeURIComponent(id)}`;

// --- the visitor ----------------------------------------------------------------

export const askQuestion = (propertyId: string, input: CommentInput) =>
  post<Comment>(`${propertyUrl(propertyId)}/comments`, input);

export const requestVisit = (propertyId: string, input: VisitRequestInput) =>
  post<unknown>(`${propertyUrl(propertyId)}/visits`, input);

// --- the seller (needs a session) ----------------------------------------------------

/** "Mis propiedades": every status, optionally narrowed to one. */
export const ownPropertiesUrl = (
  status: PropertyStatus | "",
  page: number,
  limit: number
) =>
  `/api/agencies/me/properties?page=${page}&limit=${limit}${
    status ? `&status=${status}` : ""
  }`;

export const statusHistoryUrl = (id: string) =>
  `${propertyUrl(id)}/status-history`;

export const createProperty = (input: PropertyInput) =>
  post<{ id: string }>("/api/properties", input);

export const updateProperty = (
  id: string,
  input: Omit<PropertyInput, "status">
) => patch<{ id: string }>(propertyUrl(id), input);

export const changePropertyStatus = (id: string, status: PropertyStatus) =>
  patch<{ id: string; status: PropertyStatus }>(`${propertyUrl(id)}/status`, {
    status,
  });

// The gallery.
export const addImage = (propertyId: string, imageUrl: string) =>
  post<PropertyImage>(`${propertyUrl(propertyId)}/images`, { imageUrl });

export const removeImage = (propertyId: string, imageId: string) =>
  del(`${propertyUrl(propertyId)}/images/${imageId}`);

export const setCoverImage = (propertyId: string, imageId: string) =>
  patch<unknown>(`${propertyUrl(propertyId)}/images/${imageId}/cover`);

export const reorderImages = (propertyId: string, imageIds: string[]) =>
  put<PropertyImage[]>(`${propertyUrl(propertyId)}/images/order`, { imageIds });
