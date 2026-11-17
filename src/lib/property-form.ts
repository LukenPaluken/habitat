import type { PropertyPayload } from "./seller-api";
import type {
  ApiPropertyDetail,
  Currency,
  OperationType,
  PropertyType,
} from "./seller-types";

// Estado, validación y armado del payload del formulario de propiedades. La
// validación del servidor sigue siendo la que manda; esto solo evita ida y
// vuelta por errores obvios y los dice en castellano, campo por campo.

export interface PropertyFormState {
  title: string;
  description: string;
  propertyType: PropertyType;
  operationType: OperationType;
  price: string;
  currency: Currency;
  address: string;
  neighborhood: string;
  coveredArea: string;
  totalArea: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  age: string;
  tags: string[];
}

export type PropertyFormErrors = Partial<
  Record<keyof PropertyFormState, string>
>;

export const EMPTY_FORM: PropertyFormState = {
  title: "",
  description: "",
  propertyType: "Departamento",
  operationType: "Venta",
  price: "",
  currency: "USD",
  address: "",
  neighborhood: "",
  coveredArea: "",
  totalArea: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  age: "",
  tags: [],
};

export const SUGGESTED_TAGS = [
  "pileta",
  "cochera",
  "balcón",
  "terraza",
  "jardín",
  "parrilla",
  "quincho",
  "apto profesional",
  "admite mascotas",
  "ascensor",
  "seguridad 24 hs",
  "amoblado",
  "aire acondicionado",
  "calefacción",
  "lavadero",
  "gimnasio",
];

const text = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export function formFromProperty(
  property: ApiPropertyDetail
): PropertyFormState {
  return {
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    operationType: property.operationType,
    price: String(Number(property.price)),
    currency: property.currency,
    address: property.address,
    neighborhood: property.neighborhood,
    coveredArea: text(property.coveredArea),
    totalArea: text(property.totalArea),
    rooms: text(property.rooms),
    bedrooms: text(property.bedrooms),
    bathrooms: text(property.bathrooms),
    age: text(property.age),
    tags: property.tags ?? [],
  };
}

/** Un terreno no tiene ambientes, dormitorios, baños ni superficie cubierta. */
export const isLand = (type: PropertyType) => type === "Terreno";

function parseOptional(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : "invalid";
}

export function validatePropertyForm(
  form: PropertyFormState
): PropertyFormErrors {
  const errors: PropertyFormErrors = {};

  if (form.title.trim().length < 3) {
    errors.title = "El título debe tener al menos 3 caracteres.";
  }
  if (form.description.trim().length < 10) {
    errors.description = "Contá un poco más: mínimo 10 caracteres.";
  }

  const price = Number(form.price);
  if (form.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
    errors.price = "Ingresá un precio mayor a 0.";
  }

  if (form.address.trim().length < 3) {
    errors.address = "Ingresá la calle y la altura.";
  }
  if (form.neighborhood.trim().length < 2) {
    errors.neighborhood = "Ingresá la zona o el barrio.";
  }

  const land = isLand(form.propertyType);

  const total = parseOptional(form.totalArea);
  const covered = land ? null : parseOptional(form.coveredArea);

  if (
    total === "invalid" ||
    (total !== null && (total <= 0 || !Number.isInteger(total)))
  ) {
    errors.totalArea = "Ingresá una superficie entera mayor a 0.";
  }
  if (
    covered === "invalid" ||
    (covered !== null && (covered <= 0 || !Number.isInteger(covered)))
  ) {
    errors.coveredArea = "Ingresá una superficie entera mayor a 0.";
  }
  if (
    typeof total === "number" &&
    typeof covered === "number" &&
    !errors.totalArea &&
    !errors.coveredArea &&
    covered > total
  ) {
    errors.coveredArea = "No puede superar la superficie total.";
  }

  const counts: [keyof PropertyFormState, number][] = [
    ["rooms", 1],
    ["bedrooms", 0],
    ["bathrooms", 0],
    ["age", 0],
  ];
  for (const [field, min] of counts) {
    if (land && field !== "age") continue;
    const value = parseOptional(form[field] as string);
    if (
      value === "invalid" ||
      (value !== null && (!Number.isInteger(value) || value < min))
    ) {
      errors[field] =
        min === 1
          ? "Ingresá un número entero desde 1."
          : "Ingresá un número entero desde 0.";
    }
  }

  return errors;
}

export function payloadFromForm(form: PropertyFormState): PropertyPayload {
  const land = isLand(form.propertyType);
  const optional = (raw: string) => {
    const value = parseOptional(raw);
    return value === "invalid" ? null : value;
  };

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    propertyType: form.propertyType,
    operationType: form.operationType,
    price: Number(form.price),
    currency: form.currency,
    address: form.address.trim(),
    neighborhood: form.neighborhood.trim(),
    totalArea: optional(form.totalArea),
    coveredArea: land ? null : optional(form.coveredArea),
    rooms: land ? null : optional(form.rooms),
    bedrooms: land ? null : optional(form.bedrooms),
    bathrooms: land ? null : optional(form.bathrooms),
    age: optional(form.age),
    tags: Array.from(
      new Set(form.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
    ),
  };
}
