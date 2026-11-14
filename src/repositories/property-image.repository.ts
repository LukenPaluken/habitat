import { and, asc, count, eq, sql } from "drizzle-orm";
import {
  propertyImages,
  type NewPropertyImage,
  type PropertyImage,
} from "@/models";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes property gallery images.

export async function findByIdInProperty(
  id: string,
  propertyId: string,
  executor: DbExecutor = db
): Promise<PropertyImage | undefined> {
  return executor.query.propertyImages.findFirst({
    where: and(
      eq(propertyImages.id, id),
      eq(propertyImages.propertyId, propertyId)
    ),
  });
}

export async function firstOfProperty(
  propertyId: string,
  executor: DbExecutor = db
): Promise<PropertyImage | undefined> {
  return executor.query.propertyImages.findFirst({
    where: eq(propertyImages.propertyId, propertyId),
    orderBy: [asc(propertyImages.order)],
  });
}

export async function countByProperty(
  propertyId: string,
  executor: DbExecutor = db
): Promise<number> {
  const [{ total }] = await executor
    .select({ total: count() })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId));
  return total;
}

// Next free position in the gallery (max + 1, so deleting images never makes
// two of them share an order).
export async function nextOrder(
  propertyId: string,
  executor: DbExecutor = db
): Promise<number> {
  const [{ next }] = await executor
    .select({
      next: sql<number>`coalesce(max(${propertyImages.order}), -1) + 1`.mapWith(
        Number
      ),
    })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId));
  return next;
}

export async function create(
  values: NewPropertyImage,
  executor: DbExecutor = db
): Promise<PropertyImage> {
  const [created] = await executor
    .insert(propertyImages)
    .values(values)
    .returning();
  return created;
}

export async function deleteById(
  id: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor.delete(propertyImages).where(eq(propertyImages.id, id));
}

export async function clearCover(
  propertyId: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor
    .update(propertyImages)
    .set({ isCover: false })
    .where(eq(propertyImages.propertyId, propertyId));
}

export async function markAsCover(
  id: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor
    .update(propertyImages)
    .set({ isCover: true })
    .where(eq(propertyImages.id, id));
}
