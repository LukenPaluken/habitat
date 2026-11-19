import { requireAgency } from "@/lib/auth-helper";
import {
  myVisitsQuerySchema,
  requestVisitSchema,
  updateVisitStatusSchema,
} from "@/lib/validations/visit";
import * as visitService from "@/services/visit.service";
import {
  created,
  handler,
  ok,
  paginated,
  queryOf,
  readJson,
  uuidParam,
} from "./http";

// CONTROLLER layer: HTTP for visit requests.

// POST /api/properties/:id/visits  (public)
export const request = handler<{ id: string }>(async (req, { params }) => {
  const propertyId = uuidParam((await params).id);
  const input = requestVisitSchema.parse(await readJson(req));

  return created(await visitService.request(propertyId, input));
});

// GET /api/agencies/me/visits?status=Pendiente&propertyId=
export const listReceived = handler(async (req) => {
  const { agency } = await requireAgency();
  const { status, propertyId, ...pagination } = myVisitsQuerySchema.parse(
    queryOf(req)
  );

  return paginated(
    await visitService.listReceived(
      agency.id,
      { status, propertyId },
      pagination
    )
  );
});

// PATCH /api/visits/:id/status
export const changeStatus = handler<{ id: string }>(async (req, { params }) => {
  const visitId = uuidParam((await params).id);
  const { agency } = await requireAgency();
  const { status } = updateVisitStatusSchema.parse(await readJson(req));

  return ok(await visitService.changeStatus(agency.id, visitId, status));
});
