import { avg, count, desc, eq } from "drizzle-orm";
import { reviews, type NewReview, type Review } from "@/models";
import {
  offsetOf,
  type Paginated,
  type PaginationParams,
} from "@/lib/pagination";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes agency reviews.

export async function create(
  values: NewReview,
  executor: DbExecutor = db
): Promise<Review> {
  const [created] = await executor.insert(reviews).values(values).returning();
  return created;
}

export async function listByAgency(
  agencyId: string,
  pagination: PaginationParams,
  executor: DbExecutor = db
): Promise<Paginated<Review>> {
  const where = eq(reviews.agencyId, agencyId);

  const [items, [{ total }]] = await Promise.all([
    executor
      .select()
      .from(reviews)
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(pagination.limit)
      .offset(offsetOf(pagination)),
    executor.select({ total: count() }).from(reviews).where(where),
  ]);

  return { items, page: pagination.page, limit: pagination.limit, total };
}

// How many reviews the agency has and their raw average (null with no reviews).
export async function statsByAgency(
  agencyId: string,
  executor: DbExecutor = db
): Promise<{ count: number; average: number | null }> {
  const [row] = await executor
    .select({ count: count(), average: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.agencyId, agencyId));

  return {
    count: row.count,
    average: row.average === null ? null : Number(row.average),
  };
}
