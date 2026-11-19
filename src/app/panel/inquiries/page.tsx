import { InquiriesScreen } from "@/components/panel/inquiries/InquiriesScreen";

// Served at `/panel/consultas`. `?propiedad=<id>` (a link from the activity
// feed) narrows it to one property; `key` starts clean when that changes.
export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>;
}) {
  const { propiedad } = await searchParams;
  return <InquiriesScreen key={propiedad} propertyId={propiedad} />;
}
