import { VisitsScreen } from "@/components/panel/visits/VisitsScreen";

// Served at `/panel/visitas`. `?propiedad=<id>` (a link from the activity
// feed) narrows it to one property; `key` starts clean when that changes.
export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>;
}) {
  const { propiedad } = await searchParams;
  return <VisitsScreen key={propiedad} propertyId={propiedad} />;
}
