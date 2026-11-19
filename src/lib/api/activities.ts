import type {
  Activity,
  ApiResponse,
  PageMeta,
  PaginatedResponse,
} from "@/types/api";
import { patch } from "./client";

// The seller's feed of news and the counter shown in the navigation.

export interface ActivitiesResponse extends PaginatedResponse<Activity> {
  meta: PageMeta & { unreadCount: number };
}
export type UnreadCountResponse = ApiResponse<{ unreadCount: number }>;

export const UNREAD_COUNT_URL = "/api/agencies/me/activities/unread-count";

export const activitiesUrl = (
  onlyUnread: boolean,
  page: number,
  limit: number
) =>
  `/api/agencies/me/activities?page=${page}&limit=${limit}${
    onlyUnread ? "&unread=true" : ""
  }`;

export const markActivityRead = (id: string) =>
  patch<Activity>(`/api/agencies/me/activities/${id}/read`);

export const markAllActivitiesRead = () =>
  patch<{ updated: number }>("/api/agencies/me/activities/read-all");
