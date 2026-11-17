import { SellerShell } from "@/components/seller/seller-shell";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerShell>{children}</SellerShell>;
}
