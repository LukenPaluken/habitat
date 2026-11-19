"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Photo of a property or a logo. URLs come from UploadThing or from any host
 * the seller pastes, hence a plain <img> instead of next/image (which
 * requires declaring every domain). If the image fails, a neutral box remains.
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
