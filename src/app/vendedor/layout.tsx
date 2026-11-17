import { UiProviders } from "@/components/ui/providers";

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UiProviders>{children}</UiProviders>;
}
