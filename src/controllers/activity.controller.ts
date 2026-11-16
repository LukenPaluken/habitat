import { requireAgency } from "@/lib/auth-helper";
import { activitiesQuerySchema } from "@/lib/validations/activity";
import * as activityService from "@/services/activity.service";
import { handler, ok, paginated, queryOf, uuidParam } from "./http";

// CONTROLLER layer: HTTP for the agency activity feed.

// GET /api/agencies/me/activities?unread=true
export const list = handler(async (request) => {
  const { agency } = await requireAgency();
  const { unread, ...pagination } = activitiesQuerySchema.parse(
    queryOf(request)
  );

  const { page, unreadCount } = await activityService.list(
    agency.id,
    { unreadOnly: unread },
    pagination
  );
  return paginated(page, { unreadCount });
});

// PATCH /api/agencies/me/activities/:id/read
export const markRead = handler<{ id: string }>(
  async (_request, { params }) => {
    const activityId = uuidParam((await params).id);
    const { agency } = await requireAgency();

    return ok(await activityService.markRead(agency.id, activityId));
  }
);

// PATCH /api/agencies/me/activities/read-all
export const markAllRead = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await activityService.markAllRead(agency.id));
});
