// What the JSON API returns, as the browser receives it: dates are ISO strings
// and `price` is a numeric string ("120000.00"). Only `import type` from the
// model here: nothing from Drizzle may end up in the browser bundle.
import type {
  Currency,
  OperationType,
  PropertySort,
  PropertyStatus,
  PropertyType,
} from "@/models";

export type {
  Currency,
  OperationType,
  PropertySort,
  PropertyStatus,
  PropertyType,
};

export interface PropertyImage {
  id: string;
  imageUrl: string;
  order: number;
  isCover: boolean;
}

export interface PropertyCore {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  operationType: OperationType;
  status: PropertyStatus;
  price: string;
  currency: Currency;
  totalArea: number | null;
  coveredArea: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  age: number | null;
  address: string;
  neighborhood: string;
  tags: string[] | null;
  createdAt: string;
}

/** One row of `GET /api/properties`. */
export interface PropertySummary extends PropertyCore {
  agency: { id: string; fantasyName: string; logoUrl: string | null };
  images: PropertyImage[];
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  sellerReply: string | null;
  createdAt: string;
}

/** `GET /api/properties/:id`. */
export interface PropertyDetail extends PropertyCore {
  agency: {
    id: string;
    fantasyName: string;
    logoUrl: string | null;
    phone: string;
    email: string;
    description: string;
  };
  images: PropertyImage[];
  comments: Comment[];
}

/** What anyone can see about an agency (never its owner's account). */
export interface AgencyProfile {
  id: string;
  fantasyName: string;
  description: string;
  logoUrl: string | null;
  phone: string;
  email: string;
  address: string | null;
}

export interface AgencyRating {
  /** `null` while the agency has no reviews. */
  average: number | null;
  count: number;
}

export interface Review {
  id: string;
  authorName: string;
  content: string;
  /** Whole number, 1 to 5. */
  rating: number;
  createdAt: string;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Envelopes: `{ data }` and `{ data: [...], meta }`.
export interface ApiResponse<T> {
  data: T;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PageMeta;
}

/** `GET /api/agencies/:id` (the page also carries previews we don't use). */
export interface AgencyPage {
  agency: AgencyProfile;
  rating: AgencyRating;
}

/** `GET /api/agencies/:id/reviews`: the page meta plus the agency's average. */
export interface ReviewListResponse extends ApiResponse<Review[]> {
  meta: PageMeta & { averageRating: number | null };
}

// Bodies the visitor sends (no account: they identify themselves on the spot).
export interface CommentInput {
  authorName: string;
  content: string;
}
export interface ReviewInput {
  authorName: string;
  content: string;
  rating: number;
}
export interface VisitRequestInput {
  requesterName: string;
  requesterPhone: string;
  /** ISO date-time. */
  proposedDate: string;
  message?: string;
}

// --- the seller's side (needs a session) ---------------------------------------

export type VisitStatus =
  "Pendiente" | "Confirmada" | "Realizada" | "Cancelada" | "Rechazada";

export type ActivityType =
  "new_comment" | "new_visit" | "property_state_change" | "new_review";

/** `GET /api/agencies/me`: the agency as its owner sees it. */
export interface OwnAgency extends AgencyProfile {
  createdAt: string;
  updatedAt: string;
}

/** One line of a property's audit log. */
export interface StatusChange {
  id: string;
  previousState: PropertyStatus | null;
  newState: PropertyStatus;
  createdAt: string;
}

/** A question received on one of the seller's properties. */
export interface ReceivedComment extends Comment {
  propertyId: string;
  propertyTitle: string;
}

/** A visit request received on one of the seller's properties. */
export interface ReceivedVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  requesterName: string;
  requesterPhone: string;
  proposedDate: string;
  message: string | null;
  status: VisitStatus;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  isRead: boolean;
  /** The property it happened on, when there is one. */
  propertyId: string | null;
  /** The comment / visit / review / property that caused it. */
  referenceId: string | null;
  createdAt: string;
}

export type StatusSummary = Record<PropertyStatus, number>;

export interface MonthlyReport {
  /** `YYYY-MM` */
  month: string;
  published: number;
  closed: number;
}

/** What the seller sends to create or edit a property. */
export interface PropertyInput {
  title: string;
  description: string;
  propertyType: PropertyType;
  operationType: OperationType;
  status?: "BORRADOR" | "PUBLICADA";
  price: string;
  currency: Currency;
  totalArea: number | null;
  coveredArea: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  age: number | null;
  address: string;
  neighborhood: string;
  tags: string[];
}

export interface AgencyUpdate {
  description?: string;
  email?: string;
  logoUrl?: string | null;
  phone?: string;
  address?: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  fantasyName: string;
  phone?: string;
}
