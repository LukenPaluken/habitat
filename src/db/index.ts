import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/habitat";

// Maintain a global singleton instance in development to prevent connection exhaustion
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 20 : 5,
    // Every date column is a `timestamp` WITHOUT time zone: Drizzle writes and
    // reads those as UTC, but `defaultNow()` is evaluated by Postgres in the
    // SESSION time zone. On a server that isn't in UTC (a laptop in Buenos
    // Aires, for instance) the two disagree and every `createdAt` comes out
    // shifted by the UTC offset ("hace 3 horas" for something sent just now).
    // Pinning the session to UTC makes both sides agree, wherever it runs.
    connection: { TimeZone: "UTC" },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export { schema };
