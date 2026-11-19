import { AMENITIES } from "@/lib/property-options";
import type {
  Currency,
  OperationType,
  PropertyDetail,
  PropertyInput,
  PropertyType,
} from "@/types/api";

// Everything about the property form that isn't markup: its starting values,
// its rules and how it becomes what the API expects.

export interface PropertyFormValues extends Record<string, string> {
  title: string;
  description: string;
  propertyType: PropertyType;
  operationType: OperationType;
  currency: Currency;
  price: string;
  address: string;
  neighborhood: string;
  totalArea: string;
  coveredArea: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  age: string;
  /** Only when creating: how it starts. */
  status: "BORRADOR" | "PUBLICADA";
}

export const EMPTY_FORM: PropertyFormValues = {
  title: "",
  description: "",
  propertyType: "Departamento",
  operationType: "Venta",
  currency: "USD",
  price: "",
  address: "",
  neighborhood: "",
  totalArea: "",
  coveredArea: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  age: "",
  status: "BORRADOR",
};

/** A Terreno has no building: no covered area, rooms, bedrooms or bathrooms. */
export const isLand = (values: Pick<PropertyFormValues, "propertyType">) =>
  values.propertyType === "Terreno";

const text = (value: number | null) => (value === null ? "" : String(value));

/** Editing starts from what is saved. */
export function fromProperty(p: PropertyDetail): {
  values: PropertyFormValues;
  tags: string[];
} {
  return {
    values: {
      ...EMPTY_FORM,
      title: p.title,
      description: p.description,
      propertyType: p.propertyType,
      operationType: p.operationType,
      currency: p.currency,
      price: String(Number(p.price)), // "120000.00" -> "120000"
      address: p.address,
      neighborhood: p.neighborhood,
      totalArea: text(p.totalArea),
      coveredArea: text(p.coveredArea),
      rooms: text(p.rooms),
      bedrooms: text(p.bedrooms),
      bathrooms: text(p.bathrooms),
      age: text(p.age),
    },
    tags: p.tags ?? [],
  };
}

const isWhole = (value: string) => /^\d+$/.test(value.trim());
const isPositive = (value: string) =>
  Number(value) > 0 && Number.isFinite(Number(value));

type Errors = Partial<Record<keyof PropertyFormValues, string>>;

export function validate(v: PropertyFormValues): Errors {
  const errors: Errors = {};

  if (v.title.trim().length < 3)
    errors.title = "El título debe tener al menos 3 caracteres.";
  if (v.description.trim().length < 10) {
    errors.description = "La descripción debe tener al menos 10 caracteres.";
  }
  if (!v.price.trim() || !isPositive(v.price))
    errors.price = "El precio debe ser mayor a 0.";
  if (v.address.trim().length < 3)
    errors.address = "Ingresá la calle y la altura.";
  if (v.neighborhood.trim().length < 2)
    errors.neighborhood = "Ingresá la zona o el barrio.";

  if (!isWhole(v.totalArea) || Number(v.totalArea) <= 0) {
    errors.totalArea =
      "La superficie total debe ser un número entero mayor a 0.";
  }

  // These do not apply to a Terreno (the fields are not even shown).
  if (!isLand(v)) {
    if (v.coveredArea.trim()) {
      if (!isWhole(v.coveredArea) || Number(v.coveredArea) <= 0) {
        errors.coveredArea =
          "La superficie cubierta debe ser un número entero mayor a 0.";
      } else if (
        !errors.totalArea &&
        Number(v.coveredArea) > Number(v.totalArea)
      ) {
        errors.coveredArea = "No puede ser mayor que la superficie total.";
      }
    }
    if (v.rooms.trim() && (!isWhole(v.rooms) || Number(v.rooms) < 1)) {
      errors.rooms = "Los ambientes deben ser un número entero, 1 o más.";
    }
    if (v.bedrooms.trim() && !isWhole(v.bedrooms)) {
      errors.bedrooms = "Ingresá un número entero (0 o más).";
    }
    if (v.bathrooms.trim() && !isWhole(v.bathrooms)) {
      errors.bathrooms = "Ingresá un número entero (0 o más).";
    }
  }
  if (v.age.trim() && !isWhole(v.age))
    errors.age = "Ingresá un número entero (0 o más).";

  return errors;
}

const num = (value: string) => (value.trim() ? Number(value) : null);

export function toInput(v: PropertyFormValues, tags: string[]): PropertyInput {
  const land = isLand(v);
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    propertyType: v.propertyType,
    operationType: v.operationType,
    status: v.status,
    price: String(Number(v.price)),
    currency: v.currency,
    totalArea: num(v.totalArea),
    // Hidden for a Terreno, and sent as null so a changed type clears them.
    coveredArea: land ? null : num(v.coveredArea),
    rooms: land ? null : num(v.rooms),
    bedrooms: land ? null : num(v.bedrooms),
    bathrooms: land ? null : num(v.bathrooms),
    age: num(v.age),
    address: v.address.trim(),
    neighborhood: v.neighborhood.trim(),
    tags,
  };
}

/** The suggested amenities plus any custom one the property already has. */
export function amenityOptions(selected: string[]): string[] {
  const known: string[] = [...AMENITIES];
  return [...known, ...selected.filter((tag) => !known.includes(tag))];
}
