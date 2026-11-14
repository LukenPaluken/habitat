import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { properties } from "./property.model";

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    order: integer("order").default(0).notNull(),
    isCover: boolean("is_cover").default(false).notNull(),
  },
  (table) => [
    index("idx_property_images_property_id").on(table.propertyId),
    uniqueIndex("idx_one_cover_per_property")
      .on(table.propertyId)
      .where(sql`${table.isCover} = true`),
  ]
);

export type PropertyImage = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;
