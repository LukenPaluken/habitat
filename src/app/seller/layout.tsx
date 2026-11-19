import { UiProviders } from "@/components/ui/providers";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UiProviders>{children}</UiProviders>;
}
