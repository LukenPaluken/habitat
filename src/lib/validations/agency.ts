import { z } from "zod";

export const updateAgencySchema = z.object({
  fantasyName: z
    .string()
    .min(2, "El nombre de fantasía debe tener al menos 2 caracteres")
    .optional(),
  description: z.string().optional(),
  phone: z
    .string()
    .min(6, "El teléfono de contacto debe tener al menos 6 caracteres")
    .optional(),
  email: z.string().email("Formato de email inválido").optional(),
  address: z.string().nullable().optional(),
  logoUrl: z
    .string()
    .url("URL de logo inválida")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
