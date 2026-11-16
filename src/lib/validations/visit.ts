import { z } from "zod";
import { visitRequestStatusEnum } from "@/models";
import { paginationQuerySchema } from "./common";

// Only the shape of the date is checked here ("is it a real date?"). The
// business rule "it must be in the future" lives in the visit service.
export const requestVisitSchema = z.object({
  requesterName: z.string().trim().min(1, "requesterName is required").max(100),
  requesterPhone: z
    .string()
    .trim()
    .min(6, "requesterPhone is required")
    .max(40),
  proposedDate: z.coerce.date(),
  message: z.string().trim().max(1000).optional(),
});

// The agency can move a request to any of these; `Pendiente` is only the
// initial state.
export const updateVisitStatusSchema = z.object({
  status: z.enum(
    visitRequestStatusEnum.enumValues.filter(
      (status) => status !== "Pendiente"
    ) as ["Confirmada", "Realizada", "Cancelada", "Rechazada"]
  ),
});

// GET /api/agencies/me/visits?status=Pendiente
export const myVisitsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(visitRequestStatusEnum.enumValues).optional(),
});

export type RequestVisitInput = z.infer<typeof requestVisitSchema>;
