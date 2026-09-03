import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  uuid,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["client", "agency", "admin"]);
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

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: roleEnum("role").default("client").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencies = pgTable("agencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  fantasyName: text("fantasy_name").notNull().unique(),
  description: text("description").notNull(),
  logoUrl: text("logo_url"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
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
  ]
);

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
  (table) => [index("idx_property_images_property_id").on(table.propertyId)]
);

export const propertyStateHistory = pgTable(
  "property_state_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    previousState: propertyStatusEnum("previous_state"),
    newState: propertyStatusEnum("new_state").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_property_state_history_property_id").on(table.propertyId),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    sellerReply: text("seller_reply"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_comments_property_id").on(table.propertyId)]
);

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

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_activities_agency_id").on(table.agencyId)]
);
