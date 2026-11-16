import { z } from "zod";
import { paginationQuerySchema } from "./common";

// GET /api/agencies/me/activities?unread=true
export const activitiesQuerySchema = paginationQuerySchema.extend({
  unread: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});
