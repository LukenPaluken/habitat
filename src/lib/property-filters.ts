import {
  AMENITIES,
  CURRENCIES,
  OPERATIONS,
  PROPERTY_TYPES,
  ROOM_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/property-options";
import type {
  Currency,
  OperationType,
  PropertySort,
  PropertyType,
} from "@/types/api";

// The search of the Home page. Its whole state lives in the URL
// (`/?type=Casa&operation=Venta&page=2`), so a search can be shared, survives a
// reload and works with the browser's Back button. This file is the three-way
// translation: URL <-> PropertyFilters <-> query string of the API.

export const PAGE_SIZE = 12;
/** The API rejects free-text and zone searches shorter than this. */
export const MIN_TEXT_LENGTH = 2;

export interface PropertyFilters {
  q: string;
  type: PropertyType | "";
  operation: OperationType | "";
  neighborhood: string;
  /** "" = any currency. A price range needs one. */
  currency: Currency | "";
  minPrice: string;
  maxPrice: string;
  rooms: string;
  tags: string[];
  sort: PropertySort;
  page: number;
}

export const DEFAULT_FILTERS: PropertyFilters = {
  q: "",
  type: "",
  operation: "",
  neighborhood: "",
  currency: "",
  minPrice: "",
  maxPrice: "",
  rooms: "",
  tags: [],
  sort: "date_desc",
  page: 1,
};

// --- URL -> filters -------------------------------------------------------------

// Anything in the URL can be typed by hand: keep only what is valid.
function oneOf<T extends string>(options: readonly T[], value: string | null) {
  return options.find((option) => option === value);
}

function text(value: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length >= MIN_TEXT_LENGTH ? trimmed : "";
}

function amount(value: string | null): string {
  return isPositiveNumber(value ?? "") ? (value as string).trim() : "";
}

export function parseFilters(params: URLSearchParams): PropertyFilters {
  const page = Number.parseInt(params.get("page") ?? "", 10);
  const minPrice = amount(params.get("minPrice"));
  const maxPrice = amount(params.get("maxPrice"));
  // A hand-edited URL with a price but no currency: assume dollars, like the API would need.
  const currency =
    oneOf(CURRENCIES, params.get("currency")) ??
    (minPrice || maxPrice ? "USD" : "");

  return {
    q: text(params.get("q")),
    type: oneOf(PROPERTY_TYPES, params.get("type")) ?? "",
    operation: oneOf(OPERATIONS, params.get("operation")) ?? "",
    neighborhood: text(params.get("neighborhood")),
    currency,
    minPrice,
    maxPrice,
    rooms: oneOf(ROOM_OPTIONS, params.get("rooms")) ?? "",
    tags: [...new Set(params.getAll("tag"))].filter((tag) =>
      (AMENITIES as readonly string[]).includes(tag)
    ),
    sort:
      SORT_OPTIONS.find((option) => option.value === params.get("sort"))
        ?.value ?? DEFAULT_FILTERS.sort,
    page: page >= 1 ? page : 1,
  };
}

// --- filters -> query string -------------------------------------------------------

/**
 * `new URLSearchParams` text for the page URL and for `GET /api/properties`
 * (they use the same names). Defaults are left out so URLs stay short.
 */
export function filtersToQuery(
  filters: PropertyFilters,
  extra: { limit?: number } = {}
): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.operation) params.set("operation", filters.operation);
  if (filters.neighborhood) params.set("neighborhood", filters.neighborhood);
  if (filters.currency) params.set("currency", filters.currency);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.rooms) params.set("rooms", filters.rooms);
  for (const tag of filters.tags) params.append("tag", tag);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (extra.limit) params.set("limit", String(extra.limit));

  return params.toString();
}

/** How many filters (not counting sort or page) narrow the results. */
export function countActiveFilters(filters: PropertyFilters): number {
  return [
    filters.q,
    filters.type,
    filters.operation,
    filters.neighborhood,
    filters.currency || filters.minPrice || filters.maxPrice,
    filters.rooms,
    filters.tags.length > 0,
  ].filter(Boolean).length;
}

// --- validation of what the user types (computed on every render) ---------------

function isPositiveNumber(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed !== "" && Number.isFinite(Number(trimmed)) && Number(trimmed) > 0
  );
}

export function validateSearchText(value: string): string | undefined {
  const length = value.trim().length;
  if (length > 0 && length < MIN_TEXT_LENGTH) {
    return `Escribí al menos ${MIN_TEXT_LENGTH} letras.`;
  }
}

export interface PriceRangeErrors {
  min?: string;
  max?: string;
}

export function validatePriceRange(min: string, max: string): PriceRangeErrors {
  const errors: PriceRangeErrors = {};
  if (min.trim() && !isPositiveNumber(min)) {
    errors.min = "Ingresá un monto mayor a 0.";
  }
  if (max.trim() && !isPositiveNumber(max)) {
    errors.max = "Ingresá un monto mayor a 0.";
  }
  if (!errors.min && !errors.max && min.trim() && max.trim()) {
    if (Number(min) > Number(max)) {
      errors.max = "El máximo no puede ser menor al mínimo.";
    }
  }
  return errors;
}
