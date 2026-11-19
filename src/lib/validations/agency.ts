import { z } from "zod";

// PATCH /api/agencies/me. The fantasy name is deliberately not editable here
// (it is unique platform-wide); `.strict()` makes sending it a clear error.
export const updateAgencySchema = z
  .object({
    description: z.string().trim().min(1, "La descripción es requerida"),
    logoUrl: z.string().url("URL de logo inválida").nullable(),
    // The PUBLIC contact email. It starts as the login email (sign-up asks for
    // one email only) and can be changed so the account's stays private.
    email: z.string().trim().email("Formato de email inválido"),
    phone: z
      .string()
      .trim()
      .min(6, "El teléfono de contacto debe tener al menos 6 caracteres"),
    address: z.string().trim().min(1).nullable(),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Mandá al menos un campo para modificar.",
  });

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
