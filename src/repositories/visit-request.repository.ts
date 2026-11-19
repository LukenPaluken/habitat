import { and, count, desc, eq, getTableColumns } from "drizzle-orm";
import {
  properties,
  visitRequests,
  type NewVisitRequest,
  type VisitRequest,
  type VisitRequestStatus,
} from "@/models";
import {
  offsetOf,
  type Paginated,
  type PaginationParams,
} from "@/lib/pagination";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes visit requests.

// A visit together with its property (needed to know which agency owns it).
export async function findByIdWithProperty(
  id: string,
  executor: DbExecutor = db
) {
  return executor.query.visitRequests.findFirst({
    where: eq(visitRequests.id, id),
    with: { property: true },
  });
}

export async function create(
  values: NewVisitRequest,
  executor: DbExecutor = db
): Promise<VisitRequest> {
  const [created] = await executor
    .insert(visitRequests)
    .values(values)
    .returning();
  return created;
}

// Compare-and-set: only changes the status if it is still `from`. Returns
// undefined when someone else answered the request first, so the caller can
// answer 409.
export async function updateStatus(
  id: string,
  from: VisitRequestStatus,
  to: VisitRequestStatus,
  executor: DbExecutor = db
): Promise<VisitRequest | undefined> {
  const [updated] = await executor
    .update(visitRequests)
    .set({ status: to })
    .where(and(eq(visitRequests.id, id), eq(visitRequests.status, from)))
    .returning();
  return updated;
}

export async function existsWithStatusForProperty(
  propertyId: string,
  status: VisitRequestStatus,
  executor: DbExecutor = db
): Promise<boolean> {
  const found = await executor.query.visitRequests.findFirst({
    columns: { id: true },
    where: and(
      eq(visitRequests.propertyId, propertyId),
      eq(visitRequests.status, status)
    ),
  });
  return found !== undefined;
}

// Every visit request received on the agency's properties, newest first.
export async function listByAgency(
  agencyId: string,
  filters: { status?: VisitRequestStatus; propertyId?: string },
  pagination: PaginationParams,
  executor: DbExecutor = db
) {
  const where = and(
    eq(properties.agencyId, agencyId),
    filters.status ? eq(visitRequests.status, filters.status) : undefined,
    filters.propertyId
      ? eq(visitRequests.propertyId, filters.propertyId)
      : undefined
  );

  const [items, [{ total }]] = await Promise.all([
    executor
      .select({
        ...getTableColumns(visitRequests),
        propertyTitle: properties.title,
      })
      .from(visitRequests)
      .innerJoin(properties, eq(visitRequests.propertyId, properties.id))
      .where(where)
      .orderBy(desc(visitRequests.createdAt))
      .limit(pagination.limit)
      .offset(offsetOf(pagination)),
    executor
      .select({ total: count() })
      .from(visitRequests)
      .innerJoin(properties, eq(visitRequests.propertyId, properties.id))
      .where(where),
  ]);

  const result: Paginated<(typeof items)[number]> = {
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
  };
  return result;
}
