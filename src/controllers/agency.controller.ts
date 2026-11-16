import { requireAgency } from "@/lib/auth-helper";
import { updateAgencySchema } from "@/lib/validations/agency";
import * as agencyService from "@/services/agency.service";
import { handler, ok, readJson, success, uuidParam } from "./http";

// CONTROLLER layer: HTTP for agencies.

// GET /api/agencies/me
export const getOwn = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await agencyService.getOwn(agency.id));
});

// PATCH /api/agencies/me
export const updateOwn = handler(async (request) => {
  const { agency } = await requireAgency();
  const patch = updateAgencySchema.parse(await readJson(request));

  return ok(await agencyService.updateOwn(agency.id, patch));
});

// DELETE /api/agencies/me
export const deleteOwn = handler(async () => {
  const { agency } = await requireAgency();
  await agencyService.deleteOwn(agency.id);
  return success();
});

// GET /api/agencies/:id  (public page of an agency)
export const getPublicPage = handler<{ id: string }>(
  async (_request, { params }) => {
    const id = uuidParam((await params).id);
    return ok(await agencyService.getPublicPage(id));
  }
);
