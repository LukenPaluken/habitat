import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getServerSession(customHeaders?: Headers) {
  const reqHeaders = customHeaders || (await headers());
  return await auth.api.getSession({
    headers: reqHeaders,
  });
}

export async function getCurrentUser(customHeaders?: Headers) {
  const session = await getServerSession(customHeaders);
  return session?.user ?? null;
}

export async function getCurrentAgency(customHeaders?: Headers) {
  const user = await getCurrentUser(customHeaders);
  if (!user) return null;

  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.userId, user.id),
  });

  return agency ?? null;
}

export async function requireAuth(customHeaders?: Headers) {
  const user = await getCurrentUser(customHeaders);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAgency(customHeaders?: Headers) {
  const user = await requireAuth(customHeaders);
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.userId, user.id),
  });

  if (!agency) {
    throw new Error("AGENCY_NOT_FOUND");
  }

  return { user, agency };
}
