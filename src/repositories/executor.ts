import { db, type Database, type Transaction } from "@/db";

// REPOSITORY layer plumbing.
//
// Every repository function takes an optional `executor` as its last argument:
// the shared `db` by default, or a transaction handle when the service wants
// several writes to commit (or fail) together. Services never import `db` or
// Drizzle: they open transactions through `withTransaction` and hand the `tx`
// to the repositories.
export type DbExecutor = Database | Transaction;

export { db };

export function withTransaction<T>(
  work: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(work);
}
