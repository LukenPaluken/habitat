import { Suspense } from "react";
import { PropertyGridSkeleton } from "@/components/properties/PropertyGrid";
import { PropertyListing } from "@/components/properties/PropertyListing";

// Home: the public property listing. Its state lives in the URL query
// (`useSearchParams`), which Next needs wrapped in <Suspense>.
export default function HomePage() {
  return (
    <Suspense fallback={<PropertyGridSkeleton />}>
      <PropertyListing />
    </Suspense>
  );
}
