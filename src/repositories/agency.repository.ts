import { eq, sql } from "drizzle-orm";
import { agencies, type Agency, type NewAgency } from "@/models";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads and writes agencies. No business rules here.

export async function findById(
  id: string,
  executor: DbExecutor = db
): Promise<Agency | undefined> {
  return executor.query.agencies.findFirst({ where: eq(agencies.id, id) });
}

export async function findByUserId(
  userId: string,
  executor: DbExecutor = db
): Promise<Agency | undefined> {
  return executor.query.agencies.findFirst({
    where: eq(agencies.userId, userId),
  });
}

// Case-insensitive lookup used to keep fantasy names unique.
export async function findByFantasyName(
  fantasyName: string,
  executor: DbExecutor = db
): Promise<Agency | undefined> {
  return executor.query.agencies.findFirst({
    where: sql`LOWER(${agencies.fantasyName}) = LOWER(${fantasyName.trim()})`,
  });
}

export async function create(
  values: NewAgency,
  executor: DbExecutor = db
): Promise<Agency> {
  const [created] = await executor.insert(agencies).values(values).returning();
  return created;
}

export async function update(
  id: string,
  values: Partial<NewAgency>,
  executor: DbExecutor = db
): Promise<Agency | undefined> {
  const [updated] = await executor
    .update(agencies)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(agencies.id, id))
    .returning();
  return updated;
}

export async function deleteById(
  id: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor.delete(agencies).where(eq(agencies.id, id));
}
