"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Foto de una propiedad o logo. Las URLs vienen de UploadThing o de cualquier
 * host que pegue el vendedor, por eso va con <img> y no con next/image (que
 * exige declarar cada dominio). Si la imagen falla, queda un recuadro neutro.
 */
export function Photo({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt || "Sin foto"}
        className={cn(
          "grid place-items-center bg-rule/60 text-stone",
          className
        )}
      >
        <ImageOff className="size-5" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={cn("bg-rule/60 object-cover", className)}
    />
  );
}
