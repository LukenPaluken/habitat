import type { Metadata } from "next";
import { VisitsView } from "@/components/seller/visits-view";

export const metadata: Metadata = { title: "Solicitudes de visita" };

export default function VisitsPage() {
  return <VisitsView />;
}
