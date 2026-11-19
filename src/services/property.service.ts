import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { PaginationParams } from "@/lib/pagination";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "@/lib/validations/property";
import { allowedTransitions, FROZEN_STATUSES } from "@/lib/property-lifecycle";
import type { Property, PropertySort, PropertyStatus } from "@/models";
import * as activityRepository from "@/repositories/activity.repository";
import { withTransaction } from "@/repositories/executor";
import * as propertyRepository from "@/repositories/property.repository";
import * as stateHistoryRepository from "@/repositories/property-state-history.repository";
import * as visitRepository from "@/repositories/visit-request.repository";

// SERVICE layer: business rules for the lifecycle of a property. It knows
// nothing about HTTP (no Request/Response) and nothing about SQL (it only talks
// to repositories).

type PhysicalAttributes = Pick<Property, "propertyType"> &
  Partial<
    Pick<
      Property,
      "totalArea" | "coveredArea" | "rooms" | "bedrooms" | "bathrooms"
    >
  >;

const LAND_FIELD_LABELS = {
  rooms: "ambientes",
  bedrooms: "dormitorios",
  bathrooms: "baños",
  coveredArea: "superficie cubierta",
} as const;

// Rules that involve several fields at once, so they can't live in a Zod
// field schema (and must also hold after merging a partial update).
function assertPropertyRules(property: PhysicalAttributes): void {
  if (property.propertyType === "Terreno") {
    for (const [field, label] of Object.entries(LAND_FIELD_LABELS)) {
      if (property[field as keyof typeof LAND_FIELD_LABELS] != null) {
        throw new ValidationError(`Un terreno no puede tener ${label}.`, {
          field,
        });
      }
    }
  }

  if (
    property.coveredArea != null &&
    property.totalArea != null &&
    property.coveredArea > property.totalArea
  ) {
    throw new ValidationError(
      "La superficie cubierta no puede ser mayor que la superficie total.",
      { field: "coveredArea" }
    );
  }
}

// The seller identity always comes from the session, never from the URL: this
// is the check that makes `/properties/:id` safe to expose.
export async function getOwnedProperty(
  agencyId: string,
  propertyId: string
): Promise<Property> {
  const property = await propertyRepository.findById(propertyId);
  if (!property) throw new NotFoundError("No encontramos la propiedad.");
  if (property.agencyId !== agencyId) {
    throw new ForbiddenError("Esta propiedad no es de tu inmobiliaria.");
  }
  return property;
}

export async function create(agencyId: string, input: CreatePropertyInput) {
  assertPropertyRules(input);

  return withTransaction(async (tx) => {
    const property = await propertyRepository.create(
      { ...input, agencyId },
      tx
    );
    // First entry of the audit log (no previous state). The reports need it to
    // know when a property was published.
    await stateHistoryRepository.create(
      {
        propertyId: property.id,
        previousState: null,
        newState: property.status,
      },
      tx
    );
    return property;
  });
}

// Drafts are private: only their agency can open them.
export async function getDetail(propertyId: string, viewerAgencyId?: string) {
  const property = await propertyRepository.findDetailById(propertyId);
  const hidden =
    property?.status === "BORRADOR" && property.agencyId !== viewerAgencyId;

  if (!property || hidden)
    throw new NotFoundError("No encontramos la propiedad.");
  return property;
}

// "Mis propiedades": every status, optionally narrowed to one.
export async function listOwn(
  agencyId: string,
  filters: { status?: PropertyStatus },
  pagination: PaginationParams & { sort: PropertySort }
) {
  return propertyRepository.search(
    { agencyId, statuses: filters.status ? [filters.status] : undefined },
    pagination
  );
}

// The audit log of a property, oldest first. Only its agency can read it.
export async function getStatusHistory(agencyId: string, propertyId: string) {
  await getOwnedProperty(agencyId, propertyId);
  return stateHistoryRepository.listByProperty(propertyId);
}

export async function update(
  agencyId: string,
  propertyId: string,
  patch: UpdatePropertyInput
) {
  const property = await getOwnedProperty(agencyId, propertyId);

  if (FROZEN_STATUSES.includes(property.status)) {
    throw new ConflictError(
      `Una propiedad ${property.status.toLowerCase()} ya no se puede editar.`
    );
  }

  const hasConfirmedVisits = await visitRepository.existsWithStatusForProperty(
    propertyId,
    "Confirmada"
  );
  if (hasConfirmedVisits) {
    throw new ConflictError(
      "No se puede editar una propiedad que tiene visitas confirmadas pendientes."
    );
  }

  assertPropertyRules({ ...property, ...patch });

  const updated = await propertyRepository.update(propertyId, patch);
  if (!updated) throw new NotFoundError("No encontramos la propiedad.");
  return updated;
}

export async function changeStatus(
  agencyId: string,
  propertyId: string,
  newStatus: PropertyStatus
) {
  const property = await getOwnedProperty(agencyId, propertyId);

  const allowed = allowedTransitions(property);
  // An invalid move (e.g. BORRADOR -> VENDIDA) is a bad request: 400. Only the
  // race below, where someone else changed the status first, is a 409.
  if (!allowed.includes(newStatus)) {
    throw new ValidationError(
      `No se puede pasar de ${property.status.toLowerCase()} a ${newStatus.toLowerCase()}. ` +
        `Opciones válidas: ${allowed.join(", ").toLowerCase() || "ninguna (es un estado final)"}.`
    );
  }

  // Status + audit log + notification succeed or fail together.
  return withTransaction(async (tx) => {
    const updated = await propertyRepository.updateStatus(
      propertyId,
      property.status,
      newStatus,
      tx
    );
    if (!updated) {
      throw new ConflictError(
        "El estado de la propiedad cambió mientras tanto. Recargá e intentá de nuevo."
      );
    }

    await stateHistoryRepository.create(
      {
        propertyId,
        previousState: property.status,
        newState: newStatus,
      },
      tx
    );

    await activityRepository.create(
      {
        agencyId,
        type: "property_state_change",
        propertyId,
        referenceId: propertyId,
        content: `La propiedad "${property.title}" cambió su estado a ${newStatus}.`,
      },
      tx
    );

    return updated;
  });
}

// A draft was never public, so it can simply be deleted (its photos and audit
// log go with it). Anything that has been published keeps its history and is
// closed with CANCELADA instead.
export async function removeDraft(agencyId: string, propertyId: string) {
  const property = await getOwnedProperty(agencyId, propertyId);

  if (property.status !== "BORRADOR") {
    throw new ConflictError(
      "Solo se pueden eliminar los borradores. Las demás propiedades se dan de baja."
    );
  }

  await propertyRepository.deleteById(propertyId);
}
