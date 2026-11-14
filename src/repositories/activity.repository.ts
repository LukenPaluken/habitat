import { and, count, desc, eq } from "drizzle-orm";
import { activities, type Activity, type NewActivity } from "@/models";
import {
  offsetOf,
  type Paginated,
  type PaginationParams,
} from "@/lib/pagination";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes the agency activity feed.

export async function create(
  values: NewActivity,
  executor: DbExecutor = db
): Promise<Activity> {
  const [created] = await executor
    .insert(activities)
    .values(values)
    .returning();
  return created;
}

export async function findById(
  id: string,
  executor: DbExecutor = db
): Promise<Activity | undefined> {
  return executor.query.activities.findFirst({ where: eq(activities.id, id) });
}

export async function listByAgency(
  agencyId: string,
  filters: { unreadOnly?: boolean },
  pagination: PaginationParams,
  executor: DbExecutor = db
): Promise<Paginated<Activity>> {
  const where = and(
    eq(activities.agencyId, agencyId),
    filters.unreadOnly ? eq(activities.isRead, false) : undefined
  );

  const [items, [{ total }]] = await Promise.all([
    executor
      .select()
      .from(activities)
      .where(where)
      .orderBy(desc(activities.createdAt))
      .limit(pagination.limit)
      .offset(offsetOf(pagination)),
    executor.select({ total: count() }).from(activities).where(where),
  ]);

  return { items, page: pagination.page, limit: pagination.limit, total };
}

export async function countUnread(
  agencyId: string,
  executor: DbExecutor = db
): Promise<number> {
  const [{ total }] = await executor
    .select({ total: count() })
    .from(activities)
    .where(
      and(eq(activities.agencyId, agencyId), eq(activities.isRead, false))
    );
  return total;
}

export async function markRead(
  id: string,
  executor: DbExecutor = db
): Promise<Activity | undefined> {
  const [updated] = await executor
    .update(activities)
    .set({ isRead: true })
    .where(eq(activities.id, id))
    .returning();
  return updated;
}

// Returns how many activities were actually flipped from unread to read.
export async function markAllRead(
  agencyId: string,
  executor: DbExecutor = db
): Promise<number> {
  const updated = await executor
    .update(activities)
    .set({ isRead: true })
    .where(and(eq(activities.agencyId, agencyId), eq(activities.isRead, false)))
    .returning({ id: activities.id });
  return updated.length;
}
