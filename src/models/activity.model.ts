import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { agencies } from "./agency.model";
import { properties } from "./property.model";
import { activityTypeEnum } from "./enums";

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    type: activityTypeEnum("type").notNull(),
    // Where the event came from, so the feed can link back to it: the property
    // it happened on (when there is one) and the id of the thing that caused
    // it (the comment, the visit request, the review or the property itself,
    // according to `type`). No foreign key on `referenceId` because it can
    // point at four different tables.
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
    referenceId: uuid("reference_id"),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_activities_agency_id").on(table.agencyId)]
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
