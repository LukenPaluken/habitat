import { NotFoundError } from "@/lib/errors";
import type { PaginationParams } from "@/lib/pagination";
import type {
  Currency,
  OperationType,
  PropertySort,
  PropertyType,
} from "@/models";
import * as agencyRepository from "@/repositories/agency.repository";
import * as propertyRepository from "@/repositories/property.repository";
import type { PropertyFilters } from "@/repositories/property.repository";

// SERVICE layer: the public property searches. There is ONE function per
// filter (each one backs its own endpoint), plus a few combos for the searches
// that repeat the most. They are all thin on purpose: the only rule they add is
// "the public only sees PUBLICADA properties". The query itself is built once,
// in the property repository.

type Listing = PaginationParams & { sort: PropertySort };

function listPublished(filters: PropertyFilters, listing: Listing) {
  return propertyRepository.search(
    { ...filters, statuses: ["PUBLICADA"] },
    listing
  );
}

// --- no filter / every filter at once ---------------------------------------

export function listAll(listing: Listing) {
  return listPublished({}, listing);
}

// The Home page: any combination of the filters below, in one query. Only the
// public-facing filters are accepted (never `statuses` or `agencyId`).
export function searchPublished(
  filters: Omit<PropertyFilters, "statuses" | "agencyId">,
  listing: Listing
) {
  return listPublished(filters, listing);
}

// --- one endpoint per filter ----------------------------------------------

export function byType(propertyType: PropertyType, listing: Listing) {
  return listPublished({ propertyType }, listing);
}

export function byOperation(operationType: OperationType, listing: Listing) {
  return listPublished({ operationType }, listing);
}

export function byNeighborhood(neighborhood: string, listing: Listing) {
  return listPublished({ neighborhood }, listing);
}

export function byPriceRange(
  range: { currency: Currency; min?: number; max?: number },
  listing: Listing
) {
  return listPublished(
    { currency: range.currency, minPrice: range.min, maxPrice: range.max },
    listing
  );
}

export function byMinRooms(minRooms: number, listing: Listing) {
  return listPublished({ minRooms }, listing);
}

export function byMinBedrooms(minBedrooms: number, listing: Listing) {
  return listPublished({ minBedrooms }, listing);
}

export function byMinBathrooms(minBathrooms: number, listing: Listing) {
  return listPublished({ minBathrooms }, listing);
}

export function byTags(tags: string[], listing: Listing) {
  return listPublished({ tags }, listing);
}

export function byText(text: string, listing: Listing) {
  return listPublished({ text }, listing);
}

export async function byAgency(agencyId: string, listing: Listing) {
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new NotFoundError("No encontramos la inmobiliaria.");
  return listPublished({ agencyId }, listing);
}

// --- combos (the few cases people search by several things at once) --------

export function byTypeAndOperation(
  criteria: { propertyType: PropertyType; operationType: OperationType },
  listing: Listing
) {
  return listPublished(criteria, listing);
}

export function byTypeOperationAndNeighborhood(
  criteria: {
    propertyType: PropertyType;
    operationType: OperationType;
    neighborhood: string;
  },
  listing: Listing
) {
  return listPublished(criteria, listing);
}
