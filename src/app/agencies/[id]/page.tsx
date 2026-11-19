import { AgencyScreen } from "@/components/agencies/AgencyScreen";

// The seller's public site, served at `/inmobiliarias/:id` (see the rewrites in
// next.config.ts). Everything dynamic is fetched in the browser.
export default async function AgencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // `key`: going from one agency to another starts from a clean screen.
  return <AgencyScreen key={id} id={id} />;
}
