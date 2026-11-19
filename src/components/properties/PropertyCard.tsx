import { ImageOff, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { formatPrice } from "@/lib/format";
import { coverImageOf } from "@/lib/property-images";
import { capitalize } from "@/lib/property-options";
import type { PropertySummary } from "@/types/api";
import { PropertyFacts } from "./PropertyFacts";

const MAX_TAGS = 3;

export function PropertyCard({
  property,
  priority = false,
}: {
  property: PropertySummary;
  priority?: boolean;
}) {
  const cover = coverImageOf(property.images);
  const tags = property.tags ?? [];

  return (
    <article className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/propiedades/${property.id}`}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] bg-slate-100">
          {cover ? (
            <RemoteImage
              src={cover.imageUrl}
              alt={`Foto de ${property.title}`}
              priority={priority}
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
              <ImageOff aria-hidden className="size-8" />
              <span className="text-xs">Sin fotos</span>
            </div>
          )}
          <Badge tone="dark" className="absolute left-3 top-3">
            {property.propertyType} · {property.operationType}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-xl font-bold text-slate-900">
            {formatPrice(
              property.price,
              property.currency,
              property.operationType
            )}
          </p>
          <h3 className="line-clamp-2 font-medium text-slate-800">
            {property.title}
          </h3>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin aria-hidden className="size-4 shrink-0" />
            <span className="truncate">
              {property.neighborhood} · {property.address}
            </span>
          </p>
          <PropertyFacts property={property} />
          {tags.length > 0 && (
            <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {tags.slice(0, MAX_TAGS).map((tag) => (
                <li key={tag}>
                  <Badge>{capitalize(tag)}</Badge>
                </li>
              ))}
              {tags.length > MAX_TAGS && (
                <li>
                  <Badge>+{tags.length - MAX_TAGS}</Badge>
                </li>
              )}
            </ul>
          )}
        </div>
      </Link>
    </article>
  );
}
