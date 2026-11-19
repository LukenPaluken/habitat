import { check, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { properties } from "./property.model";
import { propertyStatusEnum } from "./enums";

export const propertyStateHistory = pgTable(
  "property_state_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    previousState: propertyStatusEnum("previous_state"),
    newState: propertyStatusEnum("new_state").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "state_actually_changes",
      sql`${table.previousState} IS NULL OR ${table.previousState} != ${table.newState}`
    ),
    index("idx_property_state_history_property_id").on(table.propertyId),
  ]
);

export type PropertyStateHistory = typeof propertyStateHistory.$inferSelect;
export type NewPropertyStateHistory = typeof propertyStateHistory.$inferInsert;
