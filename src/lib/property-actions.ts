import { allowedTransitions } from "@/lib/property-lifecycle";
import type { OperationType, PropertyStatus } from "@/types/api";

// The buttons the seller sees for a property. WHICH moves are valid comes from
// the same table the API enforces (`property-lifecycle`), so the screen never
// offers one the API would refuse (a draft never shows "Marcar vendida"); this
// file only says how each move is called and which ones ask first.

export interface StatusAction {
  target: PropertyStatus;
  label: string;
  /** Moves that close or remove the property can't be taken back. */
  needsConfirm: boolean;
  /** What the confirmation dialog warns about. */
  warning?: string;
}

const CLOSING_WARNING =
  "La propiedad deja de estar disponible y ya no se va a poder editar ni volver a publicar.";

function describe(from: PropertyStatus, target: PropertyStatus): StatusAction {
  switch (target) {
    case "PUBLICADA":
      return {
        target,
        label: from === "PAUSADA" ? "Republicar" : "Publicar",
        needsConfirm: false,
      };
    case "PAUSADA":
      return { target, label: "Pausar", needsConfirm: false };
    case "RESERVADA":
      return { target, label: "Marcar reservada", needsConfirm: false };
    case "VENDIDA":
      return {
        target,
        label: "Marcar vendida",
        needsConfirm: true,
        warning: CLOSING_WARNING,
      };
    case "ALQUILADA":
      return {
        target,
        label: "Marcar alquilada",
        needsConfirm: true,
        warning: CLOSING_WARNING,
      };
    default:
      return {
        target,
        label: "Dar de baja",
        needsConfirm: true,
        warning: CLOSING_WARNING,
      };
  }
}

export function statusActionsFor(property: {
  status: PropertyStatus;
  operationType: OperationType;
}): StatusAction[] {
  return allowedTransitions(property).map((target) =>
    describe(property.status, target)
  );
}
