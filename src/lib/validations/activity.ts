import { z } from "zod";

export const activityFilterSchema = z.object({
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
