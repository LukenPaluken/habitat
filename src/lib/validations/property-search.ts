import { z } from "zod";
import {
  currencyEnum,
  operationTypeEnum,
  PROPERTY_SORTS,
  propertyStatusEnum,
  propertyTypeEnum,
} from "@/models";
import { caseInsensitiveEnum, paginationQuerySchema } from "./common";

// One schema per filter endpoint. Each filter lives on its own route (see
// `src/app/api/properties/*`); the ones used together a lot are combined in the
// `*Params` schemas at the bottom.

// Every listing accepts `?page=&limit=&sort=`.
export const listQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(PROPERTY_SORTS).default("date_desc"),
});

export const typeParam = caseInsensitiveEnum(propertyTypeEnum.enumValues);
export const operationParam = caseInsensitiveEnum(operationTypeEnum.enumValues);

// Next may hand dynamic segments over still percent-encoded ("Villa%20Urquiza").
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
export const neighborhoodParam = z
  .string()
  .transform(safeDecode)
  .pipe(z.string().trim().min(2).max(100));

// "2 or more" for rooms / bedrooms / bathrooms.
export const minCountParam = z.coerce.number().int().min(1).max(50);

export const searchTextQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

// `?tag=pileta&tag=cochera` (all of them required).
export const tagsQuerySchema = z.object({
  tag: z.array(z.string().trim().toLowerCase().min(1).max(40)).min(1),
});

// `?currency=USD&min=100000&max=200000`. A price range is meaningless without
// the currency, so it is required.
export const priceQuerySchema = z
  .object({
    currency: z.enum(currencyEnum.enumValues),
    min: z.coerce.number().positive().optional(),
    max: z.coerce.number().positive().optional(),
  })
  .refine((q) => q.min !== undefined || q.max !== undefined, {
    message: "Indicá un precio mínimo o máximo.",
  })
  .refine((q) => q.min === undefined || q.max === undefined || q.min <= q.max, {
    message: "El mínimo no puede ser mayor que el máximo.",
  });

// The Home page combines several filters at once, so `GET /api/properties`
// also accepts all of them in the query string (every one is optional):
//   ?type=Casa&operation=Venta&q=pileta&neighborhood=Palermo
//   &currency=USD&minPrice=100000&maxPrice=200000&rooms=3&tag=pileta&tag=cochera
// A form sends untouched inputs as `key=`, so an empty string means "no filter".
function optional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional()
  );
}

export const combinedSearchQuerySchema = listQuerySchema
  .extend({
    type: optional(typeParam),
    operation: optional(operationParam),
    q: optional(searchTextQuerySchema.shape.q),
    neighborhood: optional(z.string().trim().min(2).max(100)),
    currency: optional(z.enum(currencyEnum.enumValues)),
    minPrice: optional(z.coerce.number().positive()),
    maxPrice: optional(z.coerce.number().positive()),
    rooms: optional(minCountParam),
    tag: z.array(tagsQuerySchema.shape.tag.element).default([]),
  })
  .refine(
    (q) =>
      (q.minPrice === undefined && q.maxPrice === undefined) ||
      q.currency !== undefined,
    { message: "Para filtrar por precio indicá la moneda." }
  )
  .refine(
    (q) =>
      q.minPrice === undefined ||
      q.maxPrice === undefined ||
      q.minPrice <= q.maxPrice,
    { message: "El precio mínimo no puede ser mayor que el máximo." }
  );

// Agency's own properties: any status, optionally narrowed to one.
export const myPropertiesQuerySchema = listQuerySchema.extend({
  status: z.enum(propertyStatusEnum.enumValues).optional(),
});

// Combos for the searches that repeat the most ("casas en venta", "casas en
// venta en Palermo"), mirroring how real-estate portals build their URLs.
export const typeAndOperationParams = z.object({
  type: typeParam,
  operation: operationParam,
});

export const typeOperationAndNeighborhoodParams = typeAndOperationParams.extend(
  { neighborhood: neighborhoodParam }
);
