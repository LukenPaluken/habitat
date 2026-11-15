import { db } from "./index";
import { sql } from "drizzle-orm";

async function runReset() {
  console.log("🗑️ Dropping and recreating public schema in PostgreSQL...");
  await db.execute(
    sql`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`
  );
  console.log("✨ PostgreSQL public schema reset successfully!");
}

runReset()
  .catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
