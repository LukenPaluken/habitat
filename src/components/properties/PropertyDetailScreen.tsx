"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useProperty } from "@/hooks/useProperties";
import { AgencyCard } from "./AgencyCard";
import { BackLink } from "./BackLink";
import { PropertyDetails } from "./PropertyDetails";
import { PropertyDetailSkeleton } from "./PropertyDetailSkeleton";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyOverview } from "./PropertyOverview";

/** The detail screen: gallery, attributes, the questions and the visit request. */
export function PropertyDetailScreen({ id }: { id: string }) {
  const { property, error, reload } = useProperty(id);

  if (error) {
    // 404: it never existed or is a draft. 400: the id in the URL is not even an id.
    if (error.status === 404 || error.status === 400) {
      return (
        <EmptyState
          icon={Building2}
          title="No encontramos esta propiedad"
          description="Puede que el link esté mal o que la publicación ya no esté disponible."
          action={
            <Link href="/" className={buttonStyles()}>
              Ver todas las propiedades
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        title="No pudimos cargar la propiedad"
        message={error.message}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-5">
      <BackLink />
      {!property ? (
        <PropertyDetailSkeleton />
      ) : (
        <>
          {/* React 19 hoists this into <head>. */}
          <title>{`${property.title} · Habitat`}</title>
          {/* One column on a phone (in this order); on desktop the overview
              and the agency stay in a column beside the rest. */}
          <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <PropertyGallery images={property.images} title={property.title} />
            <aside className="space-y-5 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start">
              <PropertyOverview property={property} />
              <AgencyCard agency={property.agency} />
            </aside>
            <div className="lg:col-start-1">
              <PropertyDetails property={property} />
            </div>
            <div className="lg:col-start-1">
              <CommentsSection
                propertyId={property.id}
                agencyName={property.agency.fantasyName}
                comments={property.comments}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
