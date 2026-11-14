import { z } from "zod";

export const createReviewSchema = z.object({
  authorName: z.string().trim().min(1, "authorName is required").max(100),
  content: z.string().trim().min(1, "content is required").max(2000),
  rating: z.number().int().min(1).max(5),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
