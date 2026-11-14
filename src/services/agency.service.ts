import { ConflictError, NotFoundError } from "@/lib/errors";
import type { UpdateAgencyInput } from "@/lib/validations/agency";
import type { Agency, PropertyStatus } from "@/models";
import * as agencyRepository from "@/repositories/agency.repository";
import * as propertyRepository from "@/repositories/property.repository";
import * as reviewRepository from "@/repositories/review.repository";

// SERVICE layer: agency profile rules.

// How much of the public agency page is inlined; the full, paginated lists are
// served by `/api/agencies/:id/properties` and `/api/agencies/:id/reviews`.
const PAGE_PREVIEW_PROPERTIES = 12;
const PAGE_PREVIEW_REVIEWS = 10;

// An agency can only be deleted once it has nothing live on the platform.
const BLOCKS_DELETION: PropertyStatus[] = ["PUBLICADA", "RESERVADA"];

// What anyone can see about an agency (never the owner's user id).
function toPublic(agency: Agency) {
  return {
    id: agency.id,
    fantasyName: agency.fantasyName,
    description: agency.description,
    logoUrl: agency.logoUrl,
    phone: agency.phone,
    email: agency.email,
    address: agency.address,
    createdAt: agency.createdAt,
  };
}

export function roundRating(average: number | null): number | null {
  return average === null ? null : Math.round(average * 10) / 10;
}

async function getAgency(agencyId: string): Promise<Agency> {
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new NotFoundError("Agency not found");
  return agency;
}

export async function getOwn(agencyId: string) {
  return getAgency(agencyId);
}

export async function updateOwn(agencyId: string, patch: UpdateAgencyInput) {
  const updated = await agencyRepository.update(agencyId, patch);
  if (!updated) throw new NotFoundError("Agency not found");
  return updated;
}

export async function deleteOwn(agencyId: string) {
  await getAgency(agencyId);

  const liveProperties = await propertyRepository.countByAgencyAndStatuses(
    agencyId,
    BLOCKS_DELETION
  );
  if (liveProperties > 0) {
    throw new ConflictError(
      `Cannot delete the agency while it has ${liveProperties} PUBLICADA or RESERVADA properties`
    );
  }

  await agencyRepository.deleteById(agencyId);
}

// Public page: contact info, rating, latest listings and latest reviews.
export async function getPublicPage(agencyId: string) {
  const agency = await getAgency(agencyId);

  const [stats, properties, reviews] = await Promise.all([
    reviewRepository.statsByAgency(agencyId),
    propertyRepository.search(
      { agencyId, statuses: ["PUBLICADA"] },
      { page: 1, limit: PAGE_PREVIEW_PROPERTIES, sort: "date_desc" }
    ),
    reviewRepository.listByAgency(agencyId, {
      page: 1,
      limit: PAGE_PREVIEW_REVIEWS,
    }),
  ]);

  return {
    agency: toPublic(agency),
    rating: { average: roundRating(stats.average), count: stats.count },
    properties,
    reviews,
  };
}
