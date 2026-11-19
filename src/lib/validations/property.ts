import { z } from "zod";
import {
  currencyEnum,
  operationTypeEnum,
  propertyStatusEnum,
  propertyTypeEnum,
} from "@/models";

// Enum schemas come straight from the model, so a new status/type only has to
// be added in one place.
export const propertyStatusSchema = z.enum(propertyStatusEnum.enumValues);
export const propertyTypeSchema = z.enum(propertyTypeEnum.enumValues);
export const operationTypeSchema = z.enum(operationTypeEnum.enumValues);
export const currencySchema = z.enum(currencyEnum.enumValues);

const tagSchema = z.string().trim().toLowerCase().min(1).max(40);

// Only the SHAPE of the payload is checked here. Cross-field business rules
// (a Terreno has no rooms, covered area <= total area...) live in the service.
export const createPropertySchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
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
  totalArea: z.coerce.number().int().positive().optional().nullable(),
  coveredArea: z.coerce.number().int().positive().optional().nullable(),
  rooms: z.coerce.number().int().positive().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  age: z.coerce.number().int().nonnegative().optional().nullable(),
  address: z.string().trim().min(3),
  neighborhood: z.string().trim().min(2),
  tags: z.array(tagSchema).optional().default([]),
});

// `status` is not editable here (it has its own endpoint) and unknown keys are
// rejected, so sending it gives a clear "Unrecognized key" error.
export const updatePropertySchema = createPropertySchema
  .omit({ status: true })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "At least one field is required",
  });

export const updatePropertyStatusSchema = z.object({
  status: propertyStatusSchema,
});

export const addImageSchema = z.object({
  imageUrl: z.string().url(),
});

// The whole gallery, in the new order (first one is shown first).
export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
