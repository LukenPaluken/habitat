"use client";

import { useRef, useState } from "react";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { uploadImages } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Photo } from "@/components/ui/photo";
import { useToast } from "@/components/ui/toast";

export interface PhotoItem {
  id: string;
  url: string;
  isCover: boolean;
}

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Property gallery: upload files (drag and drop or pick), paste a URL,
 * choose the cover and remove photos. It does not know whether it saves to
 * the server or in memory: that is up to whoever uses it.
 */
export function PhotoManager({
  photos,
  disabled,
  onAdd,
  onSetCover,
  onRemove,
}: {
  photos: PhotoItem[];
  disabled?: boolean;
  onAdd: (urls: string[]) => Promise<void>;
  onSetCover: (id: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
}) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  async function run(task: () => Promise<void> | void) {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length === 0) {
      toast.error("Elegí archivos de imagen (JPG, PNG o WebP).");
      return;
    }
    await run(async () => {
      let urls: string[];
      try {
        urls = await uploadImages(files);
      } catch (error) {
        throw new Error(
          `No pudimos subir las fotos (${errorMessage(error)}). Probá pegando la URL de la imagen.`
        );
      }
      await onAdd(urls);
    });
  }

  async function addUrl() {
    const value = url.trim();
    if (!isUrl(value)) {
      setUrlError("Pegá una URL completa que empiece con https://");
      return;
    }
    setUrlError(null);
    await run(() => onAdd([value]));
    setUrl("");
  }

  return (
    <div className="flex flex-col gap-5">
      {!disabled && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col gap-4 border border-dashed p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
            dragging ? "border-ink bg-paper" : "border-rule-strong bg-sheet"
          )}
        >
          <div className="text-sm">
            <p className="font-medium">Arrastrá las fotos acá</p>
            <p className="text-stone">JPG, PNG o WebP, hasta 4 MB cada una.</p>
          </div>
          <Button
            variant="outline"
            loading={busy}
            onClick={() => fileInput.current?.click()}
          >
            Elegir archivos
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {!disabled && (
        <div>
          <div className="flex max-w-xl gap-2">
            <Input
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addUrl();
                }
              }}
              placeholder="…o pegá la URL de una imagen"
              aria-label="URL de una imagen"
              aria-invalid={urlError ? true : undefined}
            />
            <Button
              variant="outline"
              onClick={addUrl}
              disabled={busy || !url.trim()}
            >
              Agregar
            </Button>
          </div>
          {urlError && (
            <p role="alert" className="mt-1.5 text-[13px] text-brick">
              {urlError}
            </p>
          )}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-stone">Todavía no hay fotos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex flex-col gap-2">
              <div className="relative">
                <Photo
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  className="aspect-[4/3] w-full"
                />
                {photo.isCover && (
                  <span className="absolute left-0 top-0 bg-ink px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-sheet">
                    Portada
                  </span>
                )}
              </div>
              {!disabled && (
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  {photo.isCover ? (
                    <span className="text-stone">Foto principal</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => onSetCover(photo.id))}
                      className="text-graphite underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink disabled:opacity-50"
                    >
                      Hacer portada
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => onRemove(photo.id))}
                    className="text-brick underline decoration-brick/40 underline-offset-4 hover:decoration-brick disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
