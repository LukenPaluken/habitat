import { NotFoundError } from "@/lib/errors";
import { withTransaction } from "@/repositories/executor";
import * as imageRepository from "@/repositories/property-image.repository";
import * as propertyService from "./property.service";

// SERVICE layer: gallery rules. Every operation first proves the property
// belongs to the calling agency. The image bytes live in UploadThing; here we
// only store the resulting URL.

async function getImageOfProperty(propertyId: string, imageId: string) {
  const image = await imageRepository.findByIdInProperty(imageId, propertyId);
  if (!image) throw new NotFoundError("Image not found");
  return image;
}

export async function add(
  agencyId: string,
  propertyId: string,
  imageUrl: string
) {
  await propertyService.getOwnedProperty(agencyId, propertyId);

  return withTransaction(async (tx) => {
    // The first image of a property becomes its cover automatically.
    const isFirstImage =
      (await imageRepository.countByProperty(propertyId, tx)) === 0;
    const order = await imageRepository.nextOrder(propertyId, tx);

    return imageRepository.create(
      { propertyId, imageUrl, order, isCover: isFirstImage },
      tx
    );
  });
}

export async function remove(
  agencyId: string,
  propertyId: string,
  imageId: string
) {
  await propertyService.getOwnedProperty(agencyId, propertyId);
  const image = await getImageOfProperty(propertyId, imageId);

  await withTransaction(async (tx) => {
    await imageRepository.deleteById(imageId, tx);

    // A gallery with images always keeps one cover.
    if (image.isCover) {
      const next = await imageRepository.firstOfProperty(propertyId, tx);
      if (next) await imageRepository.markAsCover(next.id, tx);
    }
  });
}

export async function setCover(
  agencyId: string,
  propertyId: string,
  imageId: string
) {
  await propertyService.getOwnedProperty(agencyId, propertyId);
  await getImageOfProperty(propertyId, imageId);

  await withTransaction(async (tx) => {
    await imageRepository.clearCover(propertyId, tx);
    await imageRepository.markAsCover(imageId, tx);
  });
}
