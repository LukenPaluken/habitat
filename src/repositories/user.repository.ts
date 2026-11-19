import { eq } from "drizzle-orm";
import { account, user } from "@/models";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: the Better Auth `user` and `account` tables. Sessions and
// logins are Better Auth's; only the seller's sign-up writes here, so it can
// share a transaction with the agency (see auth.service.ts).

export async function findByEmail(email: string, executor: DbExecutor = db) {
  return executor.query.user.findFirst({ where: eq(user.email, email) });
}

export async function create(
  values: { id: string; name: string; email: string },
  executor: DbExecutor = db
) {
  const [created] = await executor
    .insert(user)
    .values({ ...values, emailVerified: false })
    .returning();
  return created;
}

// The email + password identity, as Better Auth's own sign-up stores it: the
// account id is the user id and `issuer` keeps its column default.
export async function createCredentialAccount(
  userId: string,
  passwordHash: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor.insert(account).values({
    id: crypto.randomUUID(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: passwordHash,
  });
}

export async function deleteById(
  id: string,
  executor: DbExecutor = db
): Promise<void> {
  await executor.delete(user).where(eq(user.id, id));
}
