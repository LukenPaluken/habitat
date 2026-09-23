import { z } from "zod";

export const visitStatusEnumValues = [
  "Pendiente",
  "Confirmada",
  "Realizada",
  "Cancelada",
  "Rechazada",
] as const;

export const createVisitRequestSchema = z.object({
  requesterName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  requesterPhone: z
    .string()
    .min(6, "El teléfono de contacto debe tener al menos 6 caracteres")
    .max(30, "El teléfono no puede exceder 30 caracteres"),
  proposedDate: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "La fecha de visita propuesta debe ser en el futuro",
  }),
  message: z
    .string()
    .max(500, "El mensaje no puede exceder 500 caracteres")
    .optional()
    .nullable(),
});

export const updateVisitStatusSchema = z.object({
  status: z.enum(visitStatusEnumValues, {
    errorMap: () => ({
      message:
        "Estado inválido. Opciones permitidas: Pendiente, Confirmada, Realizada, Cancelada, Rechazada",
    }),
  }),
});

export type CreateVisitRequestInput = z.infer<typeof createVisitRequestSchema>;
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;
