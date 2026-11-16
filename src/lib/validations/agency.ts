import { z } from "zod";

// PATCH /api/agencies/me. The fantasy name is deliberately not editable here
// (it is unique platform-wide); `.strict()` makes sending it a clear error.
export const updateAgencySchema = z
  .object({
    description: z.string().trim().min(1, "La descripción es requerida"),
    logoUrl: z.string().url("URL de logo inválida").nullable(),
    phone: z
      .string()
      .trim()
      .min(6, "El teléfono de contacto debe tener al menos 6 caracteres"),
    address: z.string().trim().min(1).nullable(),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "At least one field is required",
  });

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
