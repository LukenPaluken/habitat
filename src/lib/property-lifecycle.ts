import type { OperationType, PropertyStatus } from "@/models";

// The property lifecycle, in ONE place. The service enforces it (409 on an
// invalid move) and the seller's screen reads it to offer only valid buttons,
// so the two can never disagree. Pure data: safe to import from the browser.

// BORRADOR -> PUBLICADA -> RESERVADA -> VENDIDA / ALQUILADA, with PAUSADA as a
// detour from PUBLICADA and CANCELADA as the exit of every live state.
// VENDIDA is only reachable from a Venta and ALQUILADA from an Alquiler.
export const STATUS_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  BORRADOR: ["PUBLICADA"],
  PUBLICADA: ["PAUSADA", "RESERVADA", "CANCELADA"],
  PAUSADA: ["PUBLICADA", "CANCELADA"],
  RESERVADA: ["VENDIDA", "ALQUILADA", "CANCELADA"],
  VENDIDA: [],
  ALQUILADA: [],
  CANCELADA: [],
};

// Closed properties keep accepting comments but their data can't change.
export const FROZEN_STATUSES: PropertyStatus[] = [
  "VENDIDA",
  "ALQUILADA",
  "CANCELADA",
];

export function allowedTransitions(property: {
  status: PropertyStatus;
  operationType: OperationType;
}): PropertyStatus[] {
  return STATUS_TRANSITIONS[property.status].filter((next) => {
    if (next === "VENDIDA") return property.operationType === "Venta";
    if (next === "ALQUILADA") return property.operationType === "Alquiler";
    return true;
  });
}

export function isEditable(status: PropertyStatus): boolean {
  return !FROZEN_STATUSES.includes(status);
}
