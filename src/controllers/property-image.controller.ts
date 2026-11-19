import { requireAgency } from "@/lib/auth-helper";
import {
  addImageSchema,
  reorderImagesSchema,
} from "@/lib/validations/property";
import * as imageService from "@/services/property-image.service";
import { created, handler, ok, readJson, success, uuidParam } from "./http";

// CONTROLLER layer: HTTP for a property's gallery.

type PropertyParams = { id: string };
type ImageParams = { id: string; imageId: string };

// POST /api/properties/:id/images
export const add = handler<PropertyParams>(async (request, { params }) => {
  const propertyId = uuidParam((await params).id);
  const { agency } = await requireAgency();
  const { imageUrl } = addImageSchema.parse(await readJson(request));

  return created(await imageService.add(agency.id, propertyId, imageUrl));
});

// DELETE /api/properties/:id/images/:imageId
export const remove = handler<ImageParams>(async (_request, { params }) => {
  const { id, imageId } = await params;
  const { agency } = await requireAgency();

  await imageService.remove(
    agency.id,
    uuidParam(id),
    uuidParam(imageId, "imageId")
  );
  return success();
});

// PATCH /api/properties/:id/images/:imageId/cover
export const setCover = handler<ImageParams>(async (_request, { params }) => {
  const { id, imageId } = await params;
  const { agency } = await requireAgency();

  await imageService.setCover(
    agency.id,
    uuidParam(id),
    uuidParam(imageId, "imageId")
  );
  return success();
});

// PUT /api/properties/:id/images/order  { imageIds: [...] }
export const reorder = handler<PropertyParams>(async (request, { params }) => {
  const propertyId = uuidParam((await params).id);
  const { agency } = await requireAgency();
  const { imageIds } = reorderImagesSchema.parse(await readJson(request));

  return ok(await imageService.reorder(agency.id, propertyId, imageIds));
});
