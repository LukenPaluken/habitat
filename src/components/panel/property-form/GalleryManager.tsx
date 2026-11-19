import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAction } from "@/hooks/useAction";
import {
  addImage,
  removeImage,
  reorderImages,
  setCoverImage,
} from "@/lib/api/properties";
import type { PropertyImage } from "@/types/api";
import { GalleryImageCard } from "./GalleryImageCard";
import { GalleryUploader } from "./GalleryUploader";

interface GalleryManagerProps {
  propertyId: string;
  /** In the seller's order (the API returns them sorted). */
  images: PropertyImage[];
  /** Reload the property after any change. */
  onChanged: () => void;
}

/** Put the photos in order, choose the cover, remove them, add more. */
export function GalleryManager({
  propertyId,
  images,
  onChanged,
}: GalleryManagerProps) {
  const [toDelete, setToDelete] = useState<PropertyImage | null>(null);

  // Every gallery operation is "call the API, then reload".
  const task = useAction(async (operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });

  /** Runs it, reloads on success, and says whether it worked. */
  async function run(operation: () => Promise<unknown>): Promise<boolean> {
    const done = await task.run(operation);
    if (done) onChanged();
    return done === true;
  }

  function move(index: number, step: -1 | 1) {
    const ids = images.map((image) => image.id);
    [ids[index], ids[index + step]] = [ids[index + step], ids[index]];
    void run(() => reorderImages(propertyId, ids));
  }

  return (
    <section
      aria-labelledby="gallery"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="space-y-1">
        <h2 id="gallery" className="text-lg font-semibold text-slate-900">
          Fotos
        </h2>
        <p className="text-sm text-slate-600">
          La primera es la portada del listado, pero podés elegir otra. Una
          publicación necesita al menos una foto.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Todavía no cargaste fotos.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <GalleryImageCard
              key={image.id}
              image={image}
              index={index}
              total={images.length}
              busy={task.isPending}
              onMakeCover={() =>
                void run(() => setCoverImage(propertyId, image.id))
              }
              onMove={(step) => move(index, step)}
              onDelete={() => setToDelete(image)}
            />
          ))}
        </ul>
      )}

      <GalleryUploader
        propertyId={propertyId}
        busy={task.isPending}
        onAddUrl={(imageUrl) => run(() => addImage(propertyId, imageUrl))}
        onUploaded={onChanged}
      />

      {task.error && !toDelete && (
        <p role="alert" className="text-sm text-red-600">
          {task.error.message}
        </p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar foto"
        message="¿Seguro que querés eliminar esta foto? No se puede deshacer."
        confirmLabel="Eliminar"
        isLoading={task.isPending}
        error={task.error?.message}
        onConfirm={() =>
          toDelete &&
          void run(async () => {
            await removeImage(propertyId, toDelete.id);
            setToDelete(null);
          })
        }
        onCancel={() => {
          setToDelete(null);
          task.reset();
        }}
      />
    </section>
  );
}
