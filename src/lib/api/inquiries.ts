import type { PageMeta, PaginatedResponse, ReceivedComment } from "@/types/api";
import { post } from "./client";

// The questions visitors leave on the seller's properties, and the replies.

export interface ReceivedCommentsResponse extends PaginatedResponse<ReceivedComment> {
  meta: PageMeta & { unanswered: number };
}

export const receivedCommentsUrl = (
  onlyPending: boolean,
  page: number,
  limit: number,
  propertyId?: string
) =>
  `/api/agencies/me/comments?page=${page}&limit=${limit}${
    onlyPending ? "&unanswered=true" : ""
  }${propertyId ? `&propertyId=${propertyId}` : ""}`;

export const replyToComment = (commentId: string, sellerReply: string) =>
  post<ReceivedComment>(`/api/comments/${commentId}/reply`, { sellerReply });
