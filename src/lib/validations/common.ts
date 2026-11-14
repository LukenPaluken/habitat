import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";

// Input schemas (DTOs) are validated by the controller BEFORE calling a service,
// so services only ever receive well-shaped data and enforce business rules.

export const uuidSchema = z.string().uuid("Invalid id");

// `?page=2&limit=20`. `page` starts at 1 and `limit` is capped (not rejected).
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(DEFAULT_PAGE_SIZE)
    .transform((limit) => Math.min(limit, MAX_PAGE_SIZE)),
});

// Path/query segments such as `/type/casa` should match `Casa`.
export function caseInsensitiveEnum<
  const T extends readonly [string, ...string[]],
>(values: T) {
  return z.string().transform((raw, ctx): T[number] => {
    const match = values.find(
      (value) => value.toLowerCase() === raw.trim().toLowerCase()
    );
    if (!match) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be one of: ${values.join(", ")}`,
      });
      return z.NEVER;
    }
    return match;
  });
}
