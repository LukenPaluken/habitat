import type { Metadata } from "next";
import { PropertyEditView } from "@/components/seller/property-edit-view";

export const metadata: Metadata = { title: "Editar propiedad" };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyEditView id={id} />;
}
