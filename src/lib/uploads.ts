import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Photos go straight from the browser to UploadThing; only the resulting URL
// is sent to our API (`POST /api/properties/:id/images`).

const { uploadFiles } = genUploader<OurFileRouter>();

/** What the upload route accepts (see `api/uploadthing/core.ts`). */
export const MAX_PHOTOS_PER_UPLOAD = 4;
export const MAX_PHOTO_MB = 4;

export async function uploadPhotos(files: File[]): Promise<string[]> {
  const uploaded = await uploadFiles("imageUploader", { files });
  return uploaded.map((file) => file.ufsUrl ?? file.url);
}
