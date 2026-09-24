import { z } from "zod";

export const propertyStatusSchema = z.enum([
  "BORRADOR",
  "PUBLICADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "PAUSADA",
  "CANCELADA",
]);

export const propertyTypeSchema = z.enum([
  "Casa",
  "Departamento",
  "Terreno",
  "Local",
]);

export const operationTypeSchema = z.enum(["Venta", "Alquiler"]);
export const currencySchema = z.enum(["ARS", "USD"]);

export const createPropertySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  propertyType: propertyTypeSchema,
  operationType: operationTypeSchema,
  status: z.enum(["BORRADOR", "PUBLICADA"]).default("BORRADOR"),
  price: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine((val) => parseFloat(val) > 0, {
      message: "Price must be greater than 0",
    }),
  currency: currencySchema.default("USD"),
  totalArea: z.coerce.number().positive().optional().nullable(),
  coveredArea: z.coerce.number().positive().optional().nullable(),
  rooms: z.coerce.number().int().positive().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  age: z.coerce.number().int().nonnegative().optional().nullable(),
  address: z.string().min(3),
  neighborhood: z.string().min(2),
  tags: z.array(z.string()).optional().default([]),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.undefined(), // Disallow status updates through standard update
});

export const updatePropertyStatusSchema = z.object({
  status: propertyStatusSchema,
});
