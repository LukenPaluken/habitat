import { ArrowRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { RemoteImage } from "@/components/ui/RemoteImage";
import type { PropertyDetail } from "@/types/api";

/** Who is selling. The phone is public on purpose: visits are arranged by call or WhatsApp. */
export function AgencyCard({ agency }: { agency: PropertyDetail["agency"] }) {
  return (
    <section
      aria-label="Inmobiliaria"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-bold text-brand-800">
          {agency.logoUrl ? (
            <RemoteImage
              src={agency.logoUrl}
              alt=""
              sizes="48px"
              className="object-cover"
            />
          ) : (
            agency.fantasyName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Publicado por</p>
          <Link
            href={`/inmobiliarias/${agency.id}`}
            className="block truncate font-semibold text-slate-900 hover:text-brand-700"
          >
            {agency.fantasyName}
          </Link>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {agency.phone && (
          <li>
            <a
              href={`tel:${agency.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2 text-slate-700 hover:text-brand-700"
            >
              <Phone aria-hidden className="size-4 text-brand-600" />
              {agency.phone}
            </a>
          </li>
        )}
        <li>
          <a
            href={`mailto:${agency.email}`}
            className="flex items-center gap-2 break-all text-slate-700 hover:text-brand-700"
          >
            <Mail aria-hidden className="size-4 shrink-0 text-brand-600" />
            {agency.email}
          </a>
        </li>
      </ul>
      <Link
        href={`/inmobiliarias/${agency.id}`}
        className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        Ver sitio de la inmobiliaria
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </section>
  );
}
