import type {
  Currency,
  OperationType,
  PropertySort,
  PropertyStatus,
  PropertyType,
} from "@/types/api";

// Fixed vocabularies of the domain, with the labels the interface shows. The
// `satisfies` keeps each list honest: a value the API doesn't know is a type
// error, not a 400 at runtime.

export const PROPERTY_TYPES = [
  "Casa",
  "Departamento",
  "Terreno",
  "Local",
] as const satisfies readonly PropertyType[];

export const OPERATIONS = [
  "Venta",
  "Alquiler",
] as const satisfies readonly OperationType[];

export const CURRENCIES = ["USD", "ARS"] as const satisfies readonly Currency[];

export const SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: "date_desc", label: "Más recientes" },
  { value: "date_asc", label: "Más antiguas" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "area_desc", label: "Mayor superficie" },
  { value: "area_asc", label: "Menor superficie" },
];

/** "Ambientes" filter: the API reads it as "N or more". */
export const ROOM_OPTIONS = ["1", "2", "3", "4", "5"] as const;

// The amenities sellers tag their properties with. They are stored lowercase.
export const AMENITIES = [
  "pileta",
  "cochera",
  "balcón",
  "jardín",
  "parrilla",
  "quincho",
  "apto profesional",
  "admite mascotas",
] as const;

/** What the detail page says when a property is not (or no longer) available. */
export const STATUS_NOTICES: Partial<Record<PropertyStatus, string>> = {
  PAUSADA: "Esta publicación está pausada por la inmobiliaria.",
  RESERVADA: "Esta propiedad está reservada.",
  VENDIDA: "Esta propiedad ya se vendió.",
  ALQUILADA: "Esta propiedad ya se alquiló.",
  CANCELADA: "Esta publicación fue dada de baja.",
};

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** How each lifecycle state reads on screen, and the badge colour that goes with it. */
export const STATUS_LABELS: Record<PropertyStatus, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  RESERVADA: "Reservada",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  PAUSADA: "Pausada",
  CANCELADA: "Cancelada",
};

export const STATUS_TONES: Record<
  PropertyStatus,
  "brand" | "neutral" | "warning" | "dark"
> = {
  BORRADOR: "neutral",
  PUBLICADA: "brand",
  RESERVADA: "warning",
  VENDIDA: "dark",
  ALQUILADA: "dark",
  PAUSADA: "warning",
  CANCELADA: "neutral",
};
