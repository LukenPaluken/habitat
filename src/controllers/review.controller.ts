import { createReviewSchema } from "@/lib/validations/review";
import { paginationQuerySchema } from "@/lib/validations/common";
import * as reviewService from "@/services/review.service";
import {
  created,
  handler,
  paginated,
  queryOf,
  readJson,
  uuidParam,
} from "./http";

// CONTROLLER layer: HTTP for agency reviews (both endpoints are public).

// POST /api/agencies/:id/reviews
export const create = handler<{ id: string }>(async (request, { params }) => {
  const agencyId = uuidParam((await params).id);
  const input = createReviewSchema.parse(await readJson(request));

  return created(await reviewService.create(agencyId, input));
});

// GET /api/agencies/:id/reviews  (with total count and average score)
export const list = handler<{ id: string }>(async (request, { params }) => {
  const agencyId = uuidParam((await params).id);
  const pagination = paginationQuerySchema.parse(queryOf(request));

  const { page, averageRating } = await reviewService.list(
    agencyId,
    pagination
  );
  return paginated(page, { averageRating });
});
