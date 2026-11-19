import { sql } from "drizzle-orm";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: the cheapest query that proves the database answers.
export async function ping(executor: DbExecutor = db): Promise<void> {
  await executor.execute(sql`select 1`);
}
