import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { agencies } from "./agency.model";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("rating_range", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
    index("idx_reviews_agency_id").on(table.agencyId),
  ]
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
