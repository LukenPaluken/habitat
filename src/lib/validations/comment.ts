import { z } from "zod";
import { paginationQuerySchema } from "./common";

// Content is mandatory and cannot be just whitespace.
export const createCommentSchema = z.object({
  authorName: z.string().trim().min(1, "authorName is required").max(100),
  content: z.string().trim().min(1, "content is required").max(2000),
});

export const replyCommentSchema = z.object({
  sellerReply: z.string().trim().min(1, "sellerReply is required").max(2000),
});

// GET /api/agencies/me/comments?unanswered=true
export const myCommentsQuerySchema = paginationQuerySchema.extend({
  unanswered: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
