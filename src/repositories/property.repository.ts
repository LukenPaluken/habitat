import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  properties,
  type Currency,
  type NewProperty,
  type OperationType,
  type Property,
  type PropertySort,
  type PropertyStatus,
  type PropertyType,
} from "@/models";
import {
  offsetOf,
  type Paginated,
  type PaginationParams,
} from "@/lib/pagination";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes properties. No business rules here.
//
// All the listing endpoints (one per filter, plus the combos) funnel into the
// single `search` function below: each endpoint just fills in the filters it
// cares about.

export interface PropertyFilters {
  statuses?: PropertyStatus[];
  agencyId?: string;
  propertyType?: PropertyType;
  operationType?: OperationType;
  /** Case-insensitive "contains" match. */
  neighborhood?: string;
  currency?: Currency;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  /** The property must have ALL of these tags. */
  tags?: string[];
  /** Case-insensitive "contains" match on title or description. */
  text?: string;
}

// `%` and `_` typed by a user must be matched literally, not as wildcards.
function containsPattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function buildWhere(filters: PropertyFilters): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];

  if (filters.statuses?.length)
    conditions.push(inArray(properties.status, filters.statuses));
  if (filters.agencyId)
    conditions.push(eq(properties.agencyId, filters.agencyId));
  if (filters.propertyType)
    conditions.push(eq(properties.propertyType, filters.propertyType));
  if (filters.operationType)
    conditions.push(eq(properties.operationType, filters.operationType));
  if (filters.neighborhood)
    conditions.push(
      ilike(properties.neighborhood, containsPattern(filters.neighborhood))
    );
  if (filters.currency)
    conditions.push(eq(properties.currency, filters.currency));
  if (filters.minPrice !== undefined)
    conditions.push(gte(properties.price, String(filters.minPrice)));
  if (filters.maxPrice !== undefined)
    conditions.push(lte(properties.price, String(filters.maxPrice)));
  if (filters.minRooms !== undefined)
    conditions.push(gte(properties.rooms, filters.minRooms));
  if (filters.minBedrooms !== undefined)
    conditions.push(gte(properties.bedrooms, filters.minBedrooms));
  if (filters.minBathrooms !== undefined)
    conditions.push(gte(properties.bathrooms, filters.minBathrooms));
  if (filters.tags?.length)
    conditions.push(arrayContains(properties.tags, filters.tags));
  if (filters.text)
    conditions.push(
      or(
        ilike(properties.title, containsPattern(filters.text)),
        ilike(properties.description, containsPattern(filters.text))
      )
    );

  return and(...conditions);
}

// Properties without area always go last, whatever the direction. `id` is the
// tie-breaker so pages never overlap.
const ORDER_BY: Record<PropertySort, SQL[]> = {
  date_desc: [desc(properties.createdAt), asc(properties.id)],
  date_asc: [asc(properties.createdAt), asc(properties.id)],
  price_asc: [asc(properties.price), asc(properties.id)],
  price_desc: [desc(properties.price), asc(properties.id)],
  area_desc: [sql`${properties.totalArea} DESC NULLS LAST`, asc(properties.id)],
  area_asc: [sql`${properties.totalArea} ASC NULLS LAST`, asc(properties.id)],
};

export async function search(
  filters: PropertyFilters,
  pagination: PaginationParams & { sort: PropertySort },
  executor: DbExecutor = db
) {
  const where = buildWhere(filters);

  const [items, [{ total }]] = await Promise.all([
    executor.query.properties.findMany({
      where,
      orderBy: ORDER_BY[pagination.sort],
      limit: pagination.limit,
      offset: offsetOf(pagination),
      with: {
        agency: { columns: { id: true, fantasyName: true, logoUrl: true } },
        images: { orderBy: (images, { asc }) => [asc(images.order)] },
      },
    }),
    executor.select({ total: count() }).from(properties).where(where),
  ]);

  const result: Paginated<(typeof items)[number]> = {
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
  };
  return result;
}

export async function findById(
  id: string,
  executor: DbExecutor = db
): Promise<Property | undefined> {
  return executor.query.properties.findFirst({ where: eq(properties.id, id) });
}

// Full detail page: gallery, agency contact data and the Q&A thread.
export async function findDetailById(id: string, executor: DbExecutor = db) {
  return executor.query.properties.findFirst({
    where: eq(properties.id, id),
    with: {
      agency: {
        columns: {
          id: true,
          fantasyName: true,
          logoUrl: true,
          phone: true,
          email: true,
          description: true,
          createdAt: true,
        },
      },
      images: { orderBy: (images, { asc }) => [asc(images.order)] },
      comments: { orderBy: (comments, { desc }) => [desc(comments.createdAt)] },
    },
  });
}

export async function create(
  values: NewProperty,
  executor: DbExecutor = db
): Promise<Property> {
  const [created] = await executor
    .insert(properties)
    .values(values)
    .returning();
  return created;
}

export async function update(
  id: string,
  values: Partial<NewProperty>,
  executor: DbExecutor = db
): Promise<Property | undefined> {
  const [updated] = await executor
    .update(properties)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(properties.id, id))
    .returning();
  return updated;
}

// Compare-and-set: only changes the status if it is still `from`. Returns
// undefined when someone else changed it first, so the caller can answer 409.
export async function updateStatus(
  id: string,
  from: PropertyStatus,
  to: PropertyStatus,
  executor: DbExecutor = db
): Promise<Property | undefined> {
  const [updated] = await executor
    .update(properties)
    .set({ status: to, updatedAt: new Date() })
    .where(and(eq(properties.id, id), eq(properties.status, from)))
    .returning();
  return updated;
}

export async function countByAgencyAndStatuses(
  agencyId: string,
  statuses: PropertyStatus[],
  executor: DbExecutor = db
): Promise<number> {
  const [{ total }] = await executor
    .select({ total: count() })
    .from(properties)
    .where(
      and(
        eq(properties.agencyId, agencyId),
        inArray(properties.status, statuses)
      )
    );
  return total;
}
