import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { properties } from "./property.model";
import { visitRequestStatusEnum } from "./enums";

export const visitRequests = pgTable(
  "visit_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    requesterName: text("requester_name").notNull(),
    requesterPhone: text("requester_phone").notNull(),
    proposedDate: timestamp("proposed_date").notNull(),
    message: text("message"),
    status: visitRequestStatusEnum("status").default("Pendiente").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_visit_requests_property_id").on(table.propertyId)]
);

export type VisitRequest = typeof visitRequests.$inferSelect;
export type NewVisitRequest = typeof visitRequests.$inferInsert;
