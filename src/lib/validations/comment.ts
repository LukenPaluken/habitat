import { z } from "zod";

export const createCommentSchema = z.object({
  authorName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  content: z
    .string()
    .min(3, "La consulta debe tener al menos 3 caracteres")
    .max(1000, "La consulta no puede exceder 1000 caracteres"),
});

export const replyCommentSchema = z.object({
  sellerReply: z
    .string()
    .min(1, "La respuesta no puede estar vacía")
    .max(1000, "La respuesta no puede exceder 1000 caracteres"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReplyCommentInput = z.infer<typeof replyCommentSchema>;
