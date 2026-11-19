import type { PropertyImage } from "@/types/api";

/** Cover first, then the seller's chosen order. */
export function orderedImages(images: PropertyImage[]): PropertyImage[] {
  return [...images].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.order - b.order
  );
}

export function coverImageOf(
  images: PropertyImage[]
): PropertyImage | undefined {
  return images.find((image) => image.isCover) ?? images[0];
}
