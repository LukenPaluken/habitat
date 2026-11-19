import { NotFoundError } from "@/lib/errors";
import type { PaginationParams } from "@/lib/pagination";
import type { CreateReviewInput } from "@/lib/validations/review";
import * as activityRepository from "@/repositories/activity.repository";
import * as agencyRepository from "@/repositories/agency.repository";
import { withTransaction } from "@/repositories/executor";
import * as reviewRepository from "@/repositories/review.repository";
import { roundRating } from "./agency.service";

// SERVICE layer: public reviews of an agency.

async function assertAgencyExists(agencyId: string) {
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new NotFoundError("No encontramos la inmobiliaria.");
  return agency;
}

export async function create(agencyId: string, input: CreateReviewInput) {
  await assertAgencyExists(agencyId);

  return withTransaction(async (tx) => {
    const review = await reviewRepository.create(
      {
        agencyId,
        authorName: input.authorName,
        content: input.content,
        rating: input.rating,
      },
      tx
    );

    await activityRepository.create(
      {
        agencyId,
        type: "new_review",
        referenceId: review.id,
        content: `${input.authorName} dejó una reseña de ${input.rating} ${
          input.rating === 1 ? "estrella" : "estrellas"
        }.`,
      },
      tx
    );

    return review;
  });
}

export async function list(agencyId: string, pagination: PaginationParams) {
  await assertAgencyExists(agencyId);

  const [page, stats] = await Promise.all([
    reviewRepository.listByAgency(agencyId, pagination),
    reviewRepository.statsByAgency(agencyId),
  ]);

  return { page, averageRating: roundRating(stats.average) };
}
