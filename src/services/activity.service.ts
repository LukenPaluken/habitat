import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { PaginationParams } from "@/lib/pagination";
import * as activityRepository from "@/repositories/activity.repository";

// SERVICE layer: the agency's notification feed. (Activities are CREATED by the
// services where the event happens: comments, visits, reviews, status changes.)

export async function list(
  agencyId: string,
  filters: { unreadOnly: boolean },
  pagination: PaginationParams
) {
  const [page, unreadCount] = await Promise.all([
    activityRepository.listByAgency(agencyId, filters, pagination),
    activityRepository.countUnread(agencyId),
  ]);
  return { page, unreadCount };
}

// For the badge in the navigation: cheap, no list attached.
export async function unreadCount(agencyId: string) {
  return { unreadCount: await activityRepository.countUnread(agencyId) };
}

export async function markRead(agencyId: string, activityId: string) {
  const activity = await activityRepository.findById(activityId);
  if (!activity) throw new NotFoundError("Activity not found");
  if (activity.agencyId !== agencyId) {
    throw new ForbiddenError("Not your activity");
  }

  const updated = await activityRepository.markRead(activityId);
  if (!updated) throw new NotFoundError("Activity not found");
  return updated;
}

export async function markAllRead(agencyId: string) {
  return { updated: await activityRepository.markAllRead(agencyId) };
}
