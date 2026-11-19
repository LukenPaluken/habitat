import { Mail, MapPin, Phone } from "lucide-react";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { StarRating } from "@/components/ui/StarRating";
import { formatRating } from "@/lib/format";
import type { AgencyProfile, AgencyRating } from "@/types/api";

function RatingSummary({ rating }: { rating: AgencyRating }) {
  if (rating.average === null) {
    return <p className="text-sm text-slate-500">Todavía sin reseñas</p>;
  }

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <StarRating value={rating.average} />
      <strong className="text-slate-900">{formatRating(rating.average)}</strong>
      <span className="text-slate-500">
        ({rating.count} {rating.count === 1 ? "reseña" : "reseñas"})
      </span>
    </p>
  );
}

/** Logo, name, rating and the ways to get in touch. */
export function AgencyHeader({
  agency,
  rating,
}: {
  agency: AgencyProfile;
  rating: AgencyRating | undefined;
}) {
  return (
    <section
      aria-label="Inmobiliaria"
      className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:p-6"
    >
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-3xl font-bold text-brand-800">
        {agency.logoUrl ? (
          <RemoteImage
            src={agency.logoUrl}
            alt={`Logo de ${agency.fantasyName}`}
            sizes="80px"
            className="object-cover"
          />
        ) : (
          agency.fantasyName.charAt(0).toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1.5">
          <h1 className="break-words text-2xl font-bold text-slate-900 sm:text-3xl">
            {agency.fantasyName}
          </h1>
          {rating && <RatingSummary rating={rating} />}
        </div>

        <p className="whitespace-pre-line break-words text-slate-700">
          {agency.description}
        </p>

        <ul className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
          {agency.phone && (
            <li>
              <a
                href={`tel:${agency.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 font-medium text-slate-800 hover:text-brand-700"
              >
                <Phone aria-hidden className="size-4 text-brand-600" />
                {agency.phone}
              </a>
            </li>
          )}
          <li>
            <a
              href={`mailto:${agency.email}`}
              className="flex items-center gap-2 break-all text-slate-800 hover:text-brand-700"
            >
              <Mail aria-hidden className="size-4 shrink-0 text-brand-600" />
              {agency.email}
            </a>
          </li>
          {agency.address && (
            <li className="flex items-start gap-2 text-slate-600">
              <MapPin
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-brand-600"
              />
              {agency.address}
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

export function AgencyHeaderSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando inmobiliaria"
      className="flex animate-pulse gap-5 rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="size-20 shrink-0 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-3">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}
