import { ImagePlus, Link2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";
import { addImage } from "@/lib/api/properties";
import {
  MAX_PHOTO_MB,
  MAX_PHOTOS_PER_UPLOAD,
  uploadPhotos,
} from "@/lib/uploads";

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

interface GalleryUploaderProps {
  propertyId: string;
  /** Another gallery operation is running. */
  busy: boolean;
  /** Adds a photo by URL through the gallery's shared "call the API, then reload". */
  onAddUrl: (imageUrl: string) => Promise<boolean>;
  /** Photos were uploaded and saved: reload the gallery. */
  onUploaded: () => void;
}

/** Two ways to add photos: upload files (UploadThing) or paste a URL. */
export function GalleryUploader({
  propertyId,
  busy,
  onAddUrl,
  onUploaded,
}: GalleryUploaderProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(files: File[]) {
    setError(undefined);
    if (files.length === 0) return;
    if (files.length > MAX_PHOTOS_PER_UPLOAD) {
      setError(`Podés subir hasta ${MAX_PHOTOS_PER_UPLOAD} fotos por vez.`);
      return;
    }
    if (files.some((file) => file.size > MAX_PHOTO_MB * 1024 * 1024)) {
      setError(`Cada foto puede pesar hasta ${MAX_PHOTO_MB} MB.`);
      return;
    }

    setIsUploading(true);
    try {
      const urls = await uploadPhotos(files);
      // One after the other, so they keep the order they were chosen in.
      for (const imageUrl of urls) await addImage(propertyId, imageUrl);
      onUploaded();
    } catch {
      setError(
        "No pudimos subir las fotos. Revisá que el servicio de imágenes esté configurado o agregalas por URL."
      );
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const urlError =
    url.trim() && !isHttpUrl(url.trim())
      ? "Ingresá una URL que empiece con http:// o https://"
      : undefined;
  const disabled = busy || isUploading;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="Elegir fotos"
        onChange={(event) =>
          void handleFiles(Array.from(event.target.files ?? []))
        }
      />
      <Button
        variant="secondary"
        isLoading={isUploading}
        disabled={disabled}
        onClick={() => fileInput.current?.click()}
      >
        <ImagePlus aria-hidden className="size-4" />
        Subir fotos
      </Button>
      <p className="text-sm text-slate-500">
        Hasta {MAX_PHOTOS_PER_UPLOAD} fotos por vez, de {MAX_PHOTO_MB} MB como
        máximo.
      </p>

      <div className="flex items-start gap-2">
        <TextField
          label="O agregar una foto por URL"
          name="imageUrl"
          className="flex-1"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          error={urlError}
          placeholder="https://…"
        />
        <Button
          variant="secondary"
          className="mt-[1.625rem]"
          disabled={disabled || !url.trim() || !!urlError}
          onClick={() =>
            // The URL stays in the field if it could not be added.
            void onAddUrl(url.trim()).then((added) => added && setUrl(""))
          }
        >
          <Link2 aria-hidden className="size-4" />
          Agregar
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
