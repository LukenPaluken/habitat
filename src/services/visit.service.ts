import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { PaginationParams } from "@/lib/pagination";
import type { RequestVisitInput } from "@/lib/validations/visit";
import type { VisitRequestStatus } from "@/models";
import * as activityRepository from "@/repositories/activity.repository";
import { withTransaction } from "@/repositories/executor";
import * as propertyRepository from "@/repositories/property.repository";
import * as visitRepository from "@/repositories/visit-request.repository";

// SERVICE layer: visit request rules.

// Pendiente -> Confirmada -> Realizada. Rechazada / Cancelada are possible at
// any moment before the visit is over. The three last states are final.
const VISIT_TRANSITIONS: Record<VisitRequestStatus, VisitRequestStatus[]> = {
  Pendiente: ["Confirmada", "Rechazada", "Cancelada"],
  Confirmada: ["Realizada", "Rechazada", "Cancelada"],
  Realizada: [],
  Rechazada: [],
  Cancelada: [],
};

export async function request(propertyId: string, input: RequestVisitInput) {
  const property = await propertyRepository.findById(propertyId);
  if (!property || property.status === "BORRADOR") {
    throw new NotFoundError("No encontramos la propiedad.");
  }

  // Paused, reserved, sold... properties can't be visited.
  if (property.status !== "PUBLICADA") {
    throw new ConflictError(
      "Esta propiedad no está recibiendo solicitudes de visita."
    );
  }

  if (input.proposedDate.getTime() <= Date.now()) {
    throw new ValidationError("La fecha propuesta tiene que ser futura.", {
      field: "proposedDate",
    });
  }

  return withTransaction(async (tx) => {
    const visit = await visitRepository.create(
      {
        propertyId,
        requesterName: input.requesterName,
        requesterPhone: input.requesterPhone,
        proposedDate: input.proposedDate,
        message: input.message || null,
      },
      tx
    );

    await activityRepository.create(
      {
        agencyId: property.agencyId,
        type: "new_visit",
        propertyId,
        referenceId: visit.id,
        content: `${input.requesterName} solicitó una visita a "${property.title}".`,
      },
      tx
    );

    return visit;
  });
}

export function listReceived(
  agencyId: string,
  filters: { status?: VisitRequestStatus; propertyId?: string },
  pagination: PaginationParams
) {
  return visitRepository.listByAgency(agencyId, filters, pagination);
}

export async function changeStatus(
  agencyId: string,
  visitId: string,
  newStatus: VisitRequestStatus
) {
  const visit = await visitRepository.findByIdWithProperty(visitId);
  if (!visit) throw new NotFoundError("No encontramos la solicitud de visita.");
  if (visit.property.agencyId !== agencyId) {
    throw new ForbiddenError("Esta propiedad no es de tu inmobiliaria.");
  }

  const allowed = VISIT_TRANSITIONS[visit.status];
  if (!allowed.includes(newStatus)) {
    throw new ConflictError(
      `Una visita ${visit.status.toLowerCase()} no puede pasar a ${newStatus.toLowerCase()}. ` +
        `Opciones válidas: ${allowed.join(", ").toLowerCase() || "ninguna (es un estado final)"}.`
    );
  }

  // If two people answer the same request at once, only the first one wins.
  const updated = await visitRepository.updateStatus(
    visitId,
    visit.status,
    newStatus
  );
  if (!updated) {
    throw new ConflictError("Esta solicitud de visita ya fue respondida.");
  }
  return updated;
}
