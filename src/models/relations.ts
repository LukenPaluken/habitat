import { relations } from "drizzle-orm";
import { user } from "./auth.model";
import { agencies } from "./agency.model";
import { reviews } from "./review.model";
import { properties } from "./property.model";
import { propertyImages } from "./property-image.model";
import { propertyStateHistory } from "./property-state-history.model";
import { comments } from "./comment.model";
import { visitRequests } from "./visit-request.model";
import { activities } from "./activity.model";

// MODEL layer: every Drizzle relation lives here (and not next to each table)
// so the entity files never import each other in a cycle. These enable
// `db.query.<table>.findMany({ with: { ... } })` in the repositories.

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  user: one(user, {
    fields: [agencies.userId],
    references: [user.id],
  }),
  properties: many(properties),
  reviews: many(reviews),
  activities: many(activities),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  agency: one(agencies, {
    fields: [reviews.agencyId],
    references: [agencies.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [properties.agencyId],
    references: [agencies.id],
  }),
  images: many(propertyImages),
  stateHistory: many(propertyStateHistory),
  comments: many(comments),
  visitRequests: many(visitRequests),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const propertyStateHistoryRelations = relations(
  propertyStateHistory,
  ({ one }) => ({
    property: one(properties, {
      fields: [propertyStateHistory.propertyId],
      references: [properties.id],
    }),
  })
);

export const commentsRelations = relations(comments, ({ one }) => ({
  property: one(properties, {
    fields: [comments.propertyId],
    references: [properties.id],
  }),
}));

export const visitRequestsRelations = relations(visitRequests, ({ one }) => ({
  property: one(properties, {
    fields: [visitRequests.propertyId],
    references: [properties.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  agency: one(agencies, {
    fields: [activities.agencyId],
    references: [agencies.id],
  }),
}));
