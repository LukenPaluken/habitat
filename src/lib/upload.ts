"use client";

import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>();

// El router de UploadThing acepta hasta 4 imágenes de 4 MB por pedido.
const BATCH = 4;
const MAX_BYTES = 4 * 1024 * 1024;

/** Sube las imágenes a UploadThing y devuelve sus URLs, en el mismo orden. */
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
