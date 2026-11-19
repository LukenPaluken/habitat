import type {
  PaginatedResponse,
  ReceivedVisit,
  VisitStatus,
} from "@/types/api";
import { patch } from "./client";

// The visits visitors ask for, as the seller answers them.

export type ReceivedVisitsResponse = PaginatedResponse<ReceivedVisit>;

export const receivedVisitsUrl = (
  status: VisitStatus | "",
  page: number,
  limit: number,
  propertyId?: string
) =>
  `/api/agencies/me/visits?page=${page}&limit=${limit}${
    status ? `&status=${status}` : ""
  }${propertyId ? `&propertyId=${propertyId}` : ""}`;

export const changeVisitStatus = (
  visitId: string,
  status: Exclude<VisitStatus, "Pendiente">
) => patch<ReceivedVisit>(`/api/visits/${visitId}/status`, { status });
