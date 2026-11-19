import { z } from "zod";
import { paginationQuerySchema, uuidSchema } from "./common";

// Content is mandatory and cannot be just whitespace.
export const createCommentSchema = z.object({
  authorName: z.string().trim().min(1, "Ingresá tu nombre.").max(100),
  content: z.string().trim().min(1, "Escribí tu consulta.").max(2000),
});

export const replyCommentSchema = z.object({
  sellerReply: z.string().trim().min(1, "Escribí la respuesta.").max(2000),
});

// GET /api/agencies/me/comments?unanswered=true&propertyId=
export const myCommentsQuerySchema = paginationQuerySchema.extend({
  propertyId: uuidSchema.optional(),
  unanswered: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
