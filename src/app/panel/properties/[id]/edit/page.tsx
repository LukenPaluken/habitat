import { PropertyFormScreen } from "@/components/panel/property-form/PropertyFormScreen";

// Served at `/panel/propiedades/:id/editar`.
export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyFormScreen id={id} />;
}
