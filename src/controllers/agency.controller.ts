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

// PUT · PATCH /api/agencies/:id  (same as /me, with the id in the URL: 403 if
// it is not the caller's agency)
export const updateById = handler<{ id: string }>(
  async (request, { params }) => {
    const id = uuidParam((await params).id);
    const { agency } = await requireAgency();
    const patch = updateAgencySchema.parse(await readJson(request));

    return ok(await agencyService.updateById(agency.id, id, patch));
  }
);

// DELETE /api/agencies/:id  (403 if it is not the caller's agency)
export const deleteById = handler<{ id: string }>(
  async (_request, { params }) => {
    const id = uuidParam((await params).id);
    const { agency } = await requireAgency();
    await agencyService.deleteById(agency.id, id);
    return success();
  }
);

// GET /api/agencies/:id  (public page of an agency)
export const getPublicPage = handler<{ id: string }>(
  async (_request, { params }) => {
    const id = uuidParam((await params).id);
    return ok(await agencyService.getPublicPage(id));
  }
);
