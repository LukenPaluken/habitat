import { PropertyDetailScreen } from "@/components/properties/PropertyDetailScreen";

// Property detail, served at `/propiedades/:id` (see the rewrites in
// next.config.ts). Everything dynamic is fetched in the browser, so the page
// itself only has to hand the id over.
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // `key`: going from one property to another starts from a clean screen.
  return <PropertyDetailScreen key={id} id={id} />;
}
