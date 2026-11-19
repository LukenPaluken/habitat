"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { BackLink } from "@/components/properties/BackLink";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useAgency } from "@/hooks/useAgencies";
import { AgencyHeader, AgencyHeaderSkeleton } from "./AgencyHeader";
import { AgencyProperties } from "./AgencyProperties";
import { AgencyReviews } from "./AgencyReviews";

/** The seller's public site: contact data, rating, properties and reviews. */
export function AgencyScreen({ id }: { id: string }) {
  const { agency, rating, error, reload } = useAgency(id);

  if (error) {
    // 404: no such agency. 400: the id in the URL is not even an id.
    if (error.status === 404 || error.status === 400) {
      return (
        <EmptyState
          icon={Store}
          title="No encontramos esta inmobiliaria"
          description="Puede que el link esté mal o que la inmobiliaria ya no esté en la plataforma."
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
        title="No pudimos cargar la inmobiliaria"
        message={error.message}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-8">
      <BackLink />
      {agency ? (
        <>
          {/* React 19 hoists this into <head>. */}
          <title>{`${agency.fantasyName} · Habitat`}</title>
          <AgencyHeader agency={agency} rating={rating} />
        </>
      ) : (
        <AgencyHeaderSkeleton />
      )}
      <AgencyProperties agencyId={id} />
      <AgencyReviews agencyId={id} onReviewPosted={reload} />
    </div>
  );
}
