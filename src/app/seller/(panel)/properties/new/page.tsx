import type { Metadata } from "next";
import { PropertyForm } from "@/components/seller/property-form";

export const metadata: Metadata = { title: "Nueva propiedad" };

export default function NewPropertyPage() {
  return <PropertyForm mode="create" />;
}
