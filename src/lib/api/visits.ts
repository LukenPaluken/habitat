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
  limit: number
) =>
  `/api/agencies/me/visits?page=${page}&limit=${limit}${
    status ? `&status=${status}` : ""
  }`;

export const changeVisitStatus = (
  visitId: string,
  status: Exclude<VisitStatus, "Pendiente">
) => patch<ReceivedVisit>(`/api/visits/${visitId}/status`, { status });
