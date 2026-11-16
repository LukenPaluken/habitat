import { pgEnum } from "drizzle-orm/pg-core";

// MODEL layer: PostgreSQL enums shared by several entities.
// Each `*Enum.enumValues` tuple is also the single source of truth for the Zod
// schemas (controllers) and the TypeScript unions (services / repositories).

export const propertyTypeEnum = pgEnum("property_type", [
  "Casa",
  "Departamento",
  "Terreno",
  "Local",
]);

export const operationTypeEnum = pgEnum("operation_type", [
  "Venta",
  "Alquiler",
]);

export const currencyEnum = pgEnum("currency", ["ARS", "USD"]);

export const propertyStatusEnum = pgEnum("property_status", [
  "BORRADOR",
  "PUBLICADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "PAUSADA",
  "CANCELADA",
]);

export const visitRequestStatusEnum = pgEnum("visit_request_status", [
  "Pendiente",
  "Confirmada",
  "Realizada",
  "Cancelada",
  "Rechazada",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "new_comment",
  "new_visit",
  "property_state_change",
  "new_review",
]);

export type PropertyType = (typeof propertyTypeEnum.enumValues)[number];
export type OperationType = (typeof operationTypeEnum.enumValues)[number];
export type Currency = (typeof currencyEnum.enumValues)[number];
export type PropertyStatus = (typeof propertyStatusEnum.enumValues)[number];
export type VisitRequestStatus =
  (typeof visitRequestStatusEnum.enumValues)[number];
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
