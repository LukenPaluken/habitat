import type { Metadata } from "next";
import { PropertiesView } from "@/components/seller/properties-view";

export const metadata: Metadata = { title: "Mis propiedades" };

export default function PropertiesPage() {
  return <PropertiesView />;
}
