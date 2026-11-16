import { createUploadthing, type FileRouter } from "uploadthing/next";
import { requireAgency } from "@/lib/auth-helper";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      const { user, agency } = await requireAgency();
      return { userId: user.id, agencyId: agency.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
