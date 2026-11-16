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
