import { z } from "zod";

export const registerSellerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fantasyName: z
    .string()
    .min(2, "El nombre de fantasía debe tener al menos 2 caracteres"),
  phone: z
    .string()
    .min(6, "El teléfono de contacto debe tener al menos 6 caracteres"),
  description: z.string().optional().default(""),
  address: z.string().optional(),
  logoUrl: z.string().url("URL de logo inválida").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type RegisterSellerInput = z.infer<typeof registerSellerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
