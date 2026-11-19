import { z } from "zod";

export const createReviewSchema = z.object({
  authorName: z.string().trim().min(1, "Ingresá tu nombre.").max(100),
  content: z.string().trim().min(1, "Escribí tu reseña.").max(2000),
  rating: z
    .number({ message: "Elegí una calificación de 1 a 5." })
    .int("La calificación va de 1 a 5.")
    .min(1, "La calificación va de 1 a 5.")
    .max(5, "La calificación va de 1 a 5."),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
