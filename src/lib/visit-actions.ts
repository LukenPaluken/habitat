import type { VisitStatus } from "@/types/api";

// What the seller can do with a visit request, by its current state. It mirrors
// the API's rules (Pendiente -> Confirmada -> Realizada, Rechazada / Cancelada
// at any time before it is over); the API still has the last word.

export type VisitTarget = Exclude<VisitStatus, "Pendiente">;

export interface VisitAction {
  label: string;
  target: VisitTarget;
  /** Rejecting or cancelling can't be taken back: it asks first. */
  needsConfirm: boolean;
}

export const VISIT_ACTIONS: Record<VisitStatus, VisitAction[]> = {
  Pendiente: [
    { label: "Confirmar", target: "Confirmada", needsConfirm: false },
    { label: "Rechazar", target: "Rechazada", needsConfirm: true },
  ],
  Confirmada: [
    { label: "Marcar realizada", target: "Realizada", needsConfirm: false },
    { label: "Cancelar", target: "Cancelada", needsConfirm: true },
  ],
  Realizada: [],
  Rechazada: [],
  Cancelada: [],
};

export const VISIT_STATUS_TONES: Record<
  VisitStatus,
  "brand" | "neutral" | "warning" | "dark"
> = {
  Pendiente: "warning",
  Confirmada: "brand",
  Realizada: "dark",
  Rechazada: "neutral",
  Cancelada: "neutral",
};

export const VISIT_FILTERS: { label: string; value: VisitStatus | "" }[] = [
  { label: "Pendientes", value: "Pendiente" },
  { label: "Confirmadas", value: "Confirmada" },
  { label: "Todas", value: "" },
];
