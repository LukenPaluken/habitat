import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { orderedImages } from "@/lib/property-images";
import { cn } from "@/lib/utils";
import type { PropertyImage } from "@/types/api";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

const arrow =
  "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white";

/** One big photo and a strip of thumbnails: clicking a thumbnail swaps the big one. */
export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const photos = orderedImages(images);
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-400 sm:aspect-[16/10]">
        <ImageOff aria-hidden className="size-10" />
        <p className="text-sm">Esta propiedad todavía no tiene fotos</p>
      </div>
    );
  }

  // `selected` is the only thing that changes; the photo on show is derived from it.
  const current = photos[selected] ?? photos[0];
  const go = (step: number) =>
    setSelected((selected + step + photos.length) % photos.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 sm:aspect-[16/10]">
        <RemoteImage
          key={current.id}
          src={current.imageUrl}
          alt={`${title} (foto ${selected + 1} de ${photos.length})`}
          sizes="(min-width: 1024px) 700px, 100vw"
          priority
          className="object-cover"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => go(-1)}
              className={cn(arrow, "left-3")}
            >
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => go(1)}
              className={cn(arrow, "right-3")}
            >
              <ChevronRight aria-hidden className="size-6" />
            </button>
            <p className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-white">
              {selected + 1} / {photos.length}
            </p>
          </>
        )}
      </div>

      {photos.length > 1 && (
        // Its own scroll container: a long strip never makes the page scroll sideways.
        <ul
          aria-label="Fotos de la propiedad"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {photos.map((photo, index) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Ver foto ${index + 1}`}
                aria-current={index === selected}
                onClick={() => setSelected(index)}
                className={cn(
                  "relative block h-16 w-24 overflow-hidden rounded-lg border-2 bg-slate-100",
                  index === selected
                    ? "border-brand-600"
                    : "border-transparent opacity-80 hover:opacity-100"
                )}
              >
                <RemoteImage
                  src={photo.imageUrl}
                  alt=""
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
