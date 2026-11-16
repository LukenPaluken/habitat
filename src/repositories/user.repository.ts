import { eq } from "drizzle-orm";
import { user } from "@/models";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: reads the Better Auth `user` table (accounts are created
// through Better Auth itself, never inserted from here).

export async function findByEmail(email: string, executor: DbExecutor = db) {
  return executor.query.user.findFirst({ where: eq(user.email, email) });
}

export async function deleteById(
  id: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor.delete(user).where(eq(user.id, id));
}
