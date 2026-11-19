import type {
  Activity,
  Agency,
  Comment,
  Currency,
  OperationType,
  Property,
  PropertyImage,
  PropertyStatus,
  PropertyType,
  VisitRequest,
  VisitRequestStatus,
} from "@/models";

// Client-side types: what arrives over HTTP after JSON.stringify
// (dates travel as ISO strings, and the `numeric` price as a string).

type Wire<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;

export type {
  Currency,
  OperationType,
  PropertyStatus,
  PropertyType,
  VisitRequestStatus,
};

export type ApiAgency = Wire<Agency>;
export type ApiImage = Wire<PropertyImage>;
export type ApiActivity = Wire<Activity>;

export type ApiProperty = Wire<Property> & {
  agency: { id: string; fantasyName: string; logoUrl: string | null };
  images: ApiImage[];
};

export type ApiPropertyDetail = Wire<Property> & {
  agency: { id: string } & Pick<
    ApiAgency,
    "fantasyName" | "logoUrl" | "phone" | "email" | "description" | "createdAt"
  >;
  images: ApiImage[];
  comments: Wire<Comment>[];
};

export type ApiVisit = Wire<VisitRequest> & { propertyTitle: string };
export type ApiComment = Wire<Comment> & { propertyTitle: string };

export interface ApiReports {
  propertiesByStatus: Record<Exclude<PropertyStatus, "BORRADOR">, number>;
  monthly: { month: string; published: number; closed: number }[];
  averageDaysOnMarket: number | null;
}

export const PROPERTY_TYPES = [
  "Casa",
  "Departamento",
  "Terreno",
  "Local",
] as const satisfies readonly PropertyType[];

export const OPERATION_TYPES = [
  "Venta",
  "Alquiler",
] as const satisfies readonly OperationType[];

export const CURRENCIES = ["USD", "ARS"] as const satisfies readonly Currency[];

export const PROPERTY_STATUSES = [
  "BORRADOR",
  "PUBLICADA",
  "PAUSADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "CANCELADA",
] as const satisfies readonly PropertyStatus[];

export const VISIT_STATUSES = [
  "Pendiente",
  "Confirmada",
  "Realizada",
  "Rechazada",
  "Cancelada",
] as const satisfies readonly VisitRequestStatus[];

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  PAUSADA: "Pausada",
  RESERVADA: "Reservada",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  CANCELADA: "Cancelada",
};

/** Closed statuses: the property can no longer be edited. */
export const FROZEN_STATUSES: PropertyStatus[] = [
  "VENDIDA",
  "ALQUILADA",
  "CANCELADA",
];
