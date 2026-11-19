import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.model";

// MODEL layer: the buyer/renter doesn't have their own account or table: they
// identify themselves with their name (or name + phone number) directly when
// commenting, requesting a visit, or leaving a review. Only the seller has an
// account, and that account resides in the `user` table managed by Better Auth
// (see auth.model.ts).
export const agencies = pgTable("agencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "no action" }),
  fantasyName: text("fantasy_name").notNull().unique(),
  description: text("description").notNull(),
  logoUrl: text("logo_url"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
