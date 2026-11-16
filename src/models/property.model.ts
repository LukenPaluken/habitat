import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { agencies } from "./agency.model";
import {
  currencyEnum,
  operationTypeEnum,
  propertyStatusEnum,
  propertyTypeEnum,
} from "./enums";

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    propertyType: propertyTypeEnum("property_type").notNull(),
    operationType: operationTypeEnum("operation_type").notNull(),
    status: propertyStatusEnum("status").default("BORRADOR").notNull(),

    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum("currency").default("USD").notNull(),

    totalArea: integer("total_area"),
    coveredArea: integer("covered_area"),
    rooms: integer("rooms"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    age: integer("age"),

    address: text("address").notNull(),
    neighborhood: text("neighborhood").notNull(),

    tags: text("tags").array(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check("price_positive", sql`${table.price} > 0`),
    check(
      "total_area_positive",
      sql`${table.totalArea} IS NULL OR ${table.totalArea} > 0`
    ),
    check(
      "covered_area_positive",
      sql`${table.coveredArea} IS NULL OR ${table.coveredArea} > 0`
    ),
    index("idx_properties_operation_type").on(table.operationType),
    index("idx_properties_status").on(table.status),
    index("idx_properties_price").on(table.price),
    index("idx_properties_search").on(
      table.propertyType,
      table.operationType,
      table.neighborhood
    ),
  ]
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

// Ways a property listing can be ordered (domain vocabulary, not a column).
export const PROPERTY_SORTS = [
  "date_desc",
  "date_asc",
  "price_asc",
  "price_desc",
  "area_desc",
  "area_asc",
] as const;
export type PropertySort = (typeof PROPERTY_SORTS)[number];
