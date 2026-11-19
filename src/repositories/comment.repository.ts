import { and, count, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { comments, properties, type Comment, type NewComment } from "@/models";
import {
  offsetOf,
  type Paginated,
  type PaginationParams,
} from "@/lib/pagination";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes property comments (public questions) and
// the single seller reply each one can have.

// A comment together with the property it was left on (needed to know which
// agency owns it).
export async function findByIdWithProperty(
  id: string,
  executor: DbExecutor = db
) {
  return executor.query.comments.findFirst({
    where: eq(comments.id, id),
    with: { property: true },
  });
}

export async function create(
  values: NewComment,
  executor: DbExecutor = db
): Promise<Comment> {
  const [created] = await executor.insert(comments).values(values).returning();
  return created;
}

// Compare-and-set: only stores the reply if there is none yet.
export async function setReply(
  id: string,
  sellerReply: string,
  executor: DbExecutor = db
): Promise<Comment | undefined> {
  const [updated] = await executor
    .update(comments)
    .set({ sellerReply, updatedAt: new Date() })
    .where(and(eq(comments.id, id), isNull(comments.sellerReply)))
    .returning();
  return updated;
}

// Every comment received on the agency's properties, newest first.
export async function listByAgency(
  agencyId: string,
  filters: { unansweredOnly?: boolean },
  pagination: PaginationParams,
  executor: DbExecutor = db
) {
  const where = and(
    eq(properties.agencyId, agencyId),
    filters.unansweredOnly ? isNull(comments.sellerReply) : undefined
  );

  const [items, [{ total }]] = await Promise.all([
    executor
      .select({
        ...getTableColumns(comments),
        propertyTitle: properties.title,
      })
      .from(comments)
      .innerJoin(properties, eq(comments.propertyId, properties.id))
      .where(where)
      .orderBy(desc(comments.createdAt))
      .limit(pagination.limit)
      .offset(offsetOf(pagination)),
    executor
      .select({ total: count() })
      .from(comments)
      .innerJoin(properties, eq(comments.propertyId, properties.id))
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

export async function countUnansweredByAgency(
  agencyId: string,
  executor: DbExecutor = db
): Promise<number> {
  const [{ total }] = await executor
    .select({ total: count() })
    .from(comments)
    .innerJoin(properties, eq(comments.propertyId, properties.id))
    .where(
      and(eq(properties.agencyId, agencyId), isNull(comments.sellerReply))
    );
  return total;
}

// The questions on one property, newest first, each with its reply (if any).
export async function listByProperty(
  propertyId: string,
  pagination: PaginationParams,
  executor: DbExecutor = db
): Promise<Paginated<Comment>> {
  const where = eq(comments.propertyId, propertyId);

  const [items, [{ total }]] = await Promise.all([
    executor
      .select()
      .from(comments)
      .where(where)
      .orderBy(desc(comments.createdAt))
      .limit(pagination.limit)
      .offset(offsetOf(pagination)),
    executor.select({ total: count() }).from(comments).where(where),
  ]);

  return { items, page: pagination.page, limit: pagination.limit, total };
}
