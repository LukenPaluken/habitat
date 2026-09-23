import { z } from "zod";

export const createReviewSchema = z.object({
  authorName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  content: z
    .string()
    .min(3, "La reseña debe tener al menos 3 caracteres")
    .max(1000, "La reseña no puede exceder 1000 caracteres"),
  rating: z
    .number({
      required_error: "La calificación es obligatoria",
      invalid_type_error: "La calificación debe ser un número entero",
    })
    .int("La calificación debe ser un número entero")
    .min(1, "La calificación mínima es 1 estrella")
    .max(5, "La calificación máxima es 5 estrellas"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
