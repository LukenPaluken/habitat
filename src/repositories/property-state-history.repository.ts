import { asc, eq } from "drizzle-orm";
import {
  propertyStateHistory,
  type NewPropertyStateHistory,
  type PropertyStateHistory,
} from "@/models";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: append-only audit log of property status changes. It feeds
// the "average time on market" report.

export async function create(
  values: NewPropertyStateHistory,
  executor: DbExecutor = db
): Promise<PropertyStateHistory> {
  const [created] = await executor
    .insert(propertyStateHistory)
    .values(values)
    .returning();
  return created;
}

// Every change of a property, oldest first (the order they happened in).
export async function listByProperty(
  propertyId: string,
  executor: DbExecutor = db
): Promise<PropertyStateHistory[]> {
  return executor
    .select()
    .from(propertyStateHistory)
    .where(eq(propertyStateHistory.propertyId, propertyId))
    .orderBy(asc(propertyStateHistory.createdAt), asc(propertyStateHistory.id));
}
