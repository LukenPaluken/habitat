"use client";

import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>();

// The UploadThing router accepts up to 4 images of 4 MB per request.
const BATCH = 4;
const MAX_BYTES = 4 * 1024 * 1024;

/** Uploads the images to UploadThing and returns their URLs, in the same order. */
export async function uploadImages(files: File[]): Promise<string[]> {
  const tooBig = files.find((file) => file.size > MAX_BYTES);
  if (tooBig) {
    throw new Error(`"${tooBig.name}" pesa más de 4 MB.`);
  }

  const urls: string[] = [];
  for (let i = 0; i < files.length; i += BATCH) {
    const uploaded = await uploadFiles("imageUploader", {
      files: files.slice(i, i + BATCH),
    });
    for (const file of uploaded) urls.push(file.ufsUrl ?? file.url);
  }
  return urls;
}
