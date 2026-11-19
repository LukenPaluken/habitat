import { getCurrentAgency, requireAgency } from "@/lib/auth-helper";
import {
  createPropertySchema,
  updatePropertySchema,
  updatePropertyStatusSchema,
} from "@/lib/validations/property";
import { myPropertiesQuerySchema } from "@/lib/validations/property-search";
import * as propertyService from "@/services/property.service";
import {
  created,
  handler,
  ok,
  paginated,
  queryOf,
  readJson,
  success,
  uuidParam,
} from "./http";

// CONTROLLER layer: HTTP for a single property (create, read, edit, change
// status) and the seller's own list. The public searches have their own
// controller: property-search.controller.ts.

type IdParams = { id: string };

// POST /api/properties
export const create = handler(async (request) => {
  const { agency } = await requireAgency();
  const input = createPropertySchema.parse(await readJson(request));

  const property = await propertyService.create(agency.id, input);

  return created(property, `/api/properties/${property.id}`);
});

// GET /api/properties/:id  (public; drafts are only visible to their agency)
export const getById = handler<IdParams>(async (_request, { params }) => {
  const id = uuidParam((await params).id);
  const viewer = await getCurrentAgency();

  return ok(await propertyService.getDetail(id, viewer?.id));
});

// PATCH /api/properties/:id
export const update = handler<IdParams>(async (request, { params }) => {
  const id = uuidParam((await params).id);
  const { agency } = await requireAgency();
  const patch = updatePropertySchema.parse(await readJson(request));

  return ok(await propertyService.update(agency.id, id, patch));
});

// PATCH /api/properties/:id/status
export const changeStatus = handler<IdParams>(async (request, { params }) => {
  const id = uuidParam((await params).id);
  const { agency } = await requireAgency();
  const { status } = updatePropertyStatusSchema.parse(await readJson(request));

  return ok(await propertyService.changeStatus(agency.id, id, status));
});

// GET /api/agencies/me/properties  (every status, for "Mis propiedades")
export const listOwn = handler(async (request) => {
  const { agency } = await requireAgency();
  const { status, ...listing } = myPropertiesQuerySchema.parse(
    queryOf(request)
  );

  return paginated(
    await propertyService.listOwn(agency.id, { status }, listing)
  );
});

// GET /api/properties/:id/status-history  (the owner's audit log, oldest first)
export const statusHistory = handler<IdParams>(async (_request, { params }) => {
  const id = uuidParam((await params).id);
  const { agency } = await requireAgency();

  return ok(await propertyService.getStatusHistory(agency.id, id));
});
