import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RemoteImage } from "@/components/ui/RemoteImage";
import type { PropertyImage } from "@/types/api";

interface GalleryImageCardProps {
  image: PropertyImage;
  /** Position in the gallery, from 0. */
  index: number;
  total: number;
  /** An operation is running: nothing else can be started. */
  busy: boolean;
  onMakeCover: () => void;
  onMove: (step: -1 | 1) => void;
  onDelete: () => void;
}

/** One photo with what can be done to it: make it the cover, move it, delete it. */
export function GalleryImageCard({
  image,
  index,
  total,
  busy,
  onMakeCover,
  onMove,
  onDelete,
}: GalleryImageCardProps) {
  return (
    <li className="flex gap-3 rounded-lg border border-slate-200 p-2">
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-slate-100">
        <RemoteImage
          src={image.imageUrl}
          alt={`Foto ${index + 1}`}
          sizes="112px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        {image.isCover ? (
          <Badge tone="brand" className="self-start">
            Portada
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={onMakeCover}
          >
            <Star aria-hidden className="size-4" />
            Marcar portada
          </Button>
        )}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Mover antes"
            disabled={busy || index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp aria-hidden className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Mover después"
            disabled={busy || index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown aria-hidden className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Eliminar foto"
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 aria-hidden className="size-4 text-red-600" />
          </Button>
        </div>
      </div>
    </li>
  );
}
