import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import * as agencyRepository from "@/repositories/agency.repository";

// Request-scoped identity helpers. Controllers call these to learn WHO is
// asking (the owner always comes from the session, never from an id in the URL);
// services then decide what that identity is allowed to do.

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

  return (await agencyRepository.findByUserId(user.id)) ?? null;
}

/** Throws UnauthorizedError (401) when there is no valid session. */
export async function requireAuth(customHeaders?: Headers) {
  const user = await getCurrentUser(customHeaders);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

/**
 * Throws UnauthorizedError (401) without a session and ForbiddenError (403)
 * when the logged user has no agency (only sellers have one).
 */
export async function requireAgency(customHeaders?: Headers) {
  const user = await requireAuth(customHeaders);
  const agency = await agencyRepository.findByUserId(user.id);

  if (!agency) {
    throw new ForbiddenError("Tu cuenta no tiene una inmobiliaria asociada.");
  }

  return { user, agency };
}
